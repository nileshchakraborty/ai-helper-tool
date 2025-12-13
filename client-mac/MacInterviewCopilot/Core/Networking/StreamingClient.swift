import Foundation

/// SSE Streaming client for AI endpoints
public class StreamingClient {
    public static let shared = StreamingClient()
    
    private let baseURL: String
    private var session: URLSession
    
    private init() {
        self.baseURL = AppConfiguration.shared.apiBaseURL
        self.session = URLSession.shared
    }
    
    // MARK: - Behavioral
    
    /// Stream behavioral coaching answer
    public func streamBehavioralAnswer(question: String, context: String) -> AsyncThrowingStream<String, Error> {
        return streamSSE(
            endpoint: "behavioral/answer",
            body: ["question": question, "context": context, "provider": "ollama"]
        )
    }
    
    // MARK: - Coding
    
    /// Stream coding assistance
    public func streamCodingAssist(question: String, code: String, screenSnapshot: Data?) -> AsyncThrowingStream<String, Error> {
        var body: [String: Any] = [
            "question": question,
            "code": code,
            "provider": "ollama"
        ]
        if let snapshot = screenSnapshot {
            body["screenSnapshot"] = snapshot.base64EncodedString()
        }
        return streamSSE(endpoint: "coding/assist", body: body)
    }
    
    // MARK: - System Design
    
    /// Stream system design analysis
    public func streamSystemDesign(problem: String, context: String) -> AsyncThrowingStream<String, Error> {
        return streamSSE(
            endpoint: "system-design/analyze",
            body: ["problem": problem, "context": context, "provider": "ollama"]
        )
    }
    
    // MARK: - Live Assist
    
    /// Stream live interview assistance from transcription
    public func streamLiveAssist(transcription: String) -> AsyncThrowingStream<String, Error> {
        return streamSSE(
            endpoint: "listen/assist",
            body: ["transcription": transcription, "interviewType": "behavioral", "provider": "ollama"]
        )
    }
    
    // MARK: - Agent Chat
    
    /// Stream agent chat with automatic routing
    public func streamAgentChat(message: String, context: String, image: Data? = nil) -> AsyncThrowingStream<String, Error> {
        var body: [String: Any] = [
            "message": message,
            "context": context,
            "provider": "ollama"
        ]
        if let imageData = image {
            body["signals"] = ["image": imageData.base64EncodedString()]
        }
        return streamSSE(endpoint: "agent/chat", body: body)
    }
    
    // MARK: - SSE Implementation
    
    private func streamSSE(endpoint: String, body: [String: Any]) -> AsyncThrowingStream<String, Error> {
        return AsyncThrowingStream { continuation in
            Task {
                do {
                    guard let url = URL(string: "\(baseURL)/\(endpoint)") else {
                        continuation.finish(throwing: StreamingError.invalidURL)
                        return
                    }
                    
                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
                    
                    // Add auth token if available
                    if let token = KeychainService.shared.getAccessToken() {
                        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                    }
                    
                    request.httpBody = try JSONSerialization.data(withJSONObject: body)
                    
                    let (bytes, response) = try await URLSession.shared.bytes(for: request)
                    
                    guard let httpResponse = response as? HTTPURLResponse else {
                        continuation.finish(throwing: StreamingError.invalidResponse)
                        return
                    }
                    
                    guard httpResponse.statusCode == 200 else {
                        continuation.finish(throwing: StreamingError.httpError(httpResponse.statusCode))
                        return
                    }
                    
                    // Parse SSE stream
                    for try await line in bytes.lines {
                        if line.hasPrefix("data: ") {
                            let payload = String(line.dropFirst(6))
                            
                            if payload == "[DONE]" {
                                continuation.finish()
                                return
                            }
                            
                            // Parse JSON and extract text
                            if let data = payload.data(using: .utf8),
                               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                                if let text = json["text"] as? String {
                                    continuation.yield(text)
                                }
                                if let error = json["error"] as? String {
                                    continuation.finish(throwing: StreamingError.serverError(error))
                                    return
                                }
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

// MARK: - Errors

public enum StreamingError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(Int)
    case serverError(String)
    
    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .invalidResponse:
            return "Invalid server response"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .serverError(let message):
            return "Server error: \(message)"
        }
    }
}
