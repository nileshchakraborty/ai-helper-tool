import Foundation

class StreamingClient {
    static let shared = StreamingClient()
    
    private init() {}
    
    func streamBehavioralAnswer(question: String, context: String, sessionId: String? = nil) -> AsyncThrowingStream<String, Error> {
        var body: [String: Any] = ["question": question, "context": context]
        if let sessionId = sessionId {
            body["sessionId"] = sessionId
        }
        return streamRequest(endpoint: "/behavioral/answer", body: body)
    }
    
    func streamCodingAssist(question: String, code: String, screenSnapshot: Data?, sessionId: String? = nil) -> AsyncThrowingStream<String, Error> {
        // Handle multipart if snapshot present, currently using JSON for simplicity in MVP
        // If snapshot is needed, we convert to base64 string
        var body: [String: Any] = ["question": question, "code": code]
        if let data = screenSnapshot {
            body["screenContext"] = data.base64EncodedString()
        }
        if let sessionId = sessionId {
            body["sessionId"] = sessionId
        }
        return streamRequest(endpoint: "/coding/assist", body: body)
    }
    
    // MARK: - New Audio-Driven Endpoints
    
    func streamConversationalCoaching(question: String, context: String) -> AsyncThrowingStream<String, Error> {
        let body: [String: Any] = ["question": question, "context": context]
        return streamRequest(endpoint: "/coach/natural", body: body)
    }
    
    func streamLiveAssist(transcription: String, interviewType: String = "behavioral") -> AsyncThrowingStream<String, Error> {
        let body: [String: Any] = ["transcription": transcription, "interviewType": interviewType]
        return streamRequest(endpoint: "/listen/assist", body: body)
    }
    
    private func streamRequest(endpoint: String, body: [String: Any]) -> AsyncThrowingStream<String, Error> {
        return AsyncThrowingStream { continuation in
            let url = URL(string: "\(AppConfiguration.shared.apiBaseURL)\(endpoint)")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
            
            if let token = KeychainService.shared.getAccessToken() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            
            do {
                request.httpBody = try JSONSerialization.data(withJSONObject: body)
            } catch {
                continuation.finish(throwing: error)
                return
            }
            
            // Re-implementing using modern async/await URLSession.bytes
            Task {
                do {
                    let (bytes, response) = try await URLSession.shared.bytes(for: request)
                    
                    guard let httpResponse = response as? HTTPURLResponse, 
                          (200...299).contains(httpResponse.statusCode) else {
                        continuation.finish(throwing: URLError(.badServerResponse))
                        return
                    }

                    for try await line in bytes.lines {
                        if line.hasPrefix("data: ") {
                            let dataContent = String(line.dropFirst(6))
                            if dataContent == "[DONE]" {
                                continuation.finish() // End of stream
                                return
                            }
                             // Try to parse JSON "text" field if applicable, or return raw
                             // Our backend sends `data: {"text": "..."}`
                             if let data = dataContent.data(using: .utf8),
                                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                                let text = json["text"] as? String {
                                 continuation.yield(text)
                             } else {
                                 // Fallback or raw echo
                                 continuation.yield(dataContent)
                             }
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
}
