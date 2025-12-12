import Foundation

class StreamingClient {
    static let shared = StreamingClient()
    
    private init() {}
    
    func streamBehavioralAnswer(question: String, context: String, sessionId: String? = nil) -> AsyncThrowingStream<String, Error> {
        return AsyncThrowingStream { continuation in
            Task {
                // 1. Try Direct Ollama if enabled
                if AppConfiguration.shared.useDirectOllama {
                    do {
                        let messages = [
                            OllamaMessage(role: "system", content: AIPrompts.behavioralSystem.replacingOccurrences(of: "{{context}}", with: context)),
                            OllamaMessage(role: "user", content: "Context: \(context)\n\nQuestion: \(question)")
                        ]
                        let stream = OllamaClient.shared.streamChat(messages: messages)
                        for try await chunk in stream {
                            continuation.yield(chunk)
                        }
                        continuation.finish()
                        return // Success
                    } catch {
                        print("⚠️ Direct Ollama failed: \(error). Falling back to Backend.")
                    }
                }
            
                // 2. Fallback to Backend
                var body: [String: Any] = ["question": question, "context": context]
                if let sessionId = sessionId {
                    body["sessionId"] = sessionId
                }
                
                let backendStream = self.streamRequest(endpoint: "/behavioral/answer", body: body)
                do {
                    for try await chunk in backendStream {
                        continuation.yield(chunk)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
    
    func streamCodingAssist(question: String, code: String, screenSnapshot: Data?, sessionId: String? = nil) -> AsyncThrowingStream<String, Error> {
        return AsyncThrowingStream { continuation in
            Task {
                // 1. Try Direct Ollama if enabled
                if AppConfiguration.shared.useDirectOllama {
                    do {
                        var messages: [OllamaMessage] = []
                        var modelToUse: String? = nil
                        
                        // Vision case
                        if let data = screenSnapshot {
                            messages.append(OllamaMessage(role: "system", content: AIPrompts.visionSystem))
                            messages.append(OllamaMessage(role: "user", content: "Analyze this image: \(question)", images: [data.base64EncodedString()]))
                            modelToUse = OllamaClient.shared.visionModel
                        } else {
                            // Regular coding case
                            messages.append(OllamaMessage(role: "system", content: AIPrompts.codingSystem))
                            messages.append(OllamaMessage(role: "user", content: "Problem: \(question)\n\nCode:\n\(code)"))
                        }
                        
                        let stream = OllamaClient.shared.streamChat(messages: messages, model: modelToUse)
                        for try await chunk in stream {
                            continuation.yield(chunk)
                        }
                        continuation.finish()
                        return // Success
                    } catch {
                         print("⚠️ Direct Ollama failed: \(error). Falling back to Backend.")
                    }
                }
            
                // 2. Fallback to Backend
                var body: [String: Any] = ["question": question, "code": code]
                if let data = screenSnapshot {
                    body["screenContext"] = data.base64EncodedString()
                }
                if let sessionId = sessionId {
                    body["sessionId"] = sessionId
                }
                
                let backendStream = self.streamRequest(endpoint: "/coding/assist", body: body)
                do {
                    for try await chunk in backendStream {
                        continuation.yield(chunk)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
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
    
    func streamSystemDesign(problem: String, context: String, sessionId: String? = nil) -> AsyncThrowingStream<String, Error> {
        var body: [String: Any] = ["problem": problem, "context": context]
        if let sessionId = sessionId {
            body["sessionId"] = sessionId
        }
        return streamRequest(endpoint: "/system-design/analyze", body: body)
    }
    
    func streamCodingAnswer(question: String, code: String, sessionId: String? = nil) -> AsyncThrowingStream<String, Error> {
        var body: [String: Any] = ["question": question, "code": code]
        if let sessionId = sessionId {
            body["sessionId"] = sessionId
        }
        return streamRequest(endpoint: "/coding/assist", body: body)
    }
    
    func streamVisionAssist(image: Data, prompt: String, sessionId: String? = nil) -> AsyncThrowingStream<String, Error> {
        return AsyncThrowingStream { continuation in
            Task {
                // 1. Try Direct Ollama if enabled
                if AppConfiguration.shared.useDirectOllama {
                    do {
                        let messages = [
                            OllamaMessage(role: "system", content: AIPrompts.visionSystem),
                            OllamaMessage(role: "user", content: "Analyze this image: \(prompt)", images: [image.base64EncodedString()])
                        ]
                        let stream = OllamaClient.shared.streamChat(messages: messages, model: OllamaClient.shared.visionModel)
                        for try await chunk in stream {
                            continuation.yield(chunk)
                        }
                        continuation.finish()
                        return // Success
                    } catch {
                         print("⚠️ Direct Ollama failed: \(error). Falling back to Backend.")
                    }
                }
                
                // 2. Fallback to Backend
                let base64Image = image.base64EncodedString()
                var body: [String: Any] = ["image": base64Image, "prompt": prompt]
                if let sessionId = sessionId {
                    body["sessionId"] = sessionId
                }
                let backendStream = self.streamRequest(endpoint: "/vision/assist", body: body)
                do {
                    for try await chunk in backendStream {
                        continuation.yield(chunk)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
    
    func streamAgentChat(message: String, context: String, image: Data? = nil, sessionId: String? = nil) -> AsyncThrowingStream<String, Error> {
        return AsyncThrowingStream { continuation in
            Task {
                // 1. Try Direct Ollama if enabled
                if AppConfiguration.shared.useDirectOllama {
                    do {
                        var messages = [OllamaMessage(role: "system", content: "You are a helpful AI assistant.")]
                        
                        var content = "Context: \(context)\n\nQuestion: \(message)"
                        
                        // Handle Image for Ollama
                        var images: [String]? = nil
                        if let imgData = image {
                            images = [imgData.base64EncodedString()]
                            content += "\n[Image Attached]"
                        }
                        
                        messages.append(OllamaMessage(role: "user", content: content, images: images))
                        
                        let stream = OllamaClient.shared.streamChat(messages: messages)
                        for try await chunk in stream {
                            continuation.yield(chunk)
                        }
                        continuation.finish()
                        return
                    } catch {
                         print("⚠️ Direct Ollama failed: \(error). Falling back to Backend.")
                    }
                }
                
                // 2. Backend (Unified Protocol)
                var body: [String: Any] = ["message": message, "context": context]
                if let imgData = image {
                    let base64 = imgData.base64EncodedString()
                    body["signals"] = ["image": base64]
                }
                
                if let sessionId = sessionId {
                    body["sessionId"] = sessionId
                }
                
                let stream = self.streamRequest(endpoint: "/agent/chat", body: body)
                do {
                    for try await chunk in stream {
                        continuation.yield(chunk)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
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
