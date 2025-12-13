import Foundation

struct OllamaMessage: Codable {
    let role: String
    let content: String
    let images: [String]?
    
    init(role: String, content: String, images: [String]? = nil) {
        self.role = role
        self.content = content
        self.images = images
    }
}

struct OllamaChatRequest: Codable {
    let model: String
    let messages: [OllamaMessage]
    let stream: Bool
}

struct OllamaChatResponse: Codable {
    let model: String
    let created_at: String
    let message: OllamaMessage
    let done: Bool
}

class OllamaClient {
    static let shared = OllamaClient()
    
    var baseURL = "http://localhost:11434"
    var defaultModel = "qwen2.5-coder:14b"
    var visionModel = "llama3.2-vision"
    
    private init() {}
    

    
    // Robust streaming using URLSession.bytes
    func streamChat(messages: [OllamaMessage], model: String? = nil) -> AsyncThrowingStream<String, Error> {
        let useModel = model ?? defaultModel
        let url = URL(string: "\(baseURL)/api/chat")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = OllamaChatRequest(model: useModel, messages: messages, stream: true)
        
        do {
            request.httpBody = try JSONEncoder().encode(body)
        } catch {
            return AsyncThrowingStream { $0.finish(throwing: error) }
        }
        
        return AsyncThrowingStream { continuation in
            Task {
                do {
                    let (bytes, response) = try await URLSession.shared.bytes(for: request)
                    
                    guard let httpResponse = response as? HTTPURLResponse,
                          (200...299).contains(httpResponse.statusCode) else {
                        continuation.finish(throwing: URLError(.badServerResponse))
                        return
                    }
                    
                    for try await line in bytes.lines {
                        if let data = line.data(using: .utf8),
                           let response = try? JSONDecoder().decode(OllamaChatResponse.self, from: data) {
                            continuation.yield(response.message.content)
                            if response.done {
                                continuation.finish()
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
