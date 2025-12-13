import Foundation

struct ChatMessage: Identifiable, Codable, Equatable {
    var id = UUID()
    let role: String // "user" or "assistant"
    let content: String
    
    init(role: String, content: String, id: UUID = UUID()) {
        self.role = role
        self.content = content
        self.id = id
    }
}
