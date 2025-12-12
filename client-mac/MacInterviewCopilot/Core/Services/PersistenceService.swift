import Foundation

class PersistenceService {
    static let shared = PersistenceService()
    
    private func getHistoryURL() -> URL? {
        guard let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return nil }
        let folder = appSupport.appendingPathComponent("MacInterviewCopilot", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appendingPathComponent("chat_history.json")
    }
    
    func saveHistory(_ messages: [ChatMessage]) {
        guard let url = getHistoryURL() else { return }
        do {
            let data = try JSONEncoder().encode(messages)
            try data.write(to: url)
        } catch {
            print("Failed to save history: \(error)")
        }
    }
    
    func loadHistory() -> [ChatMessage] {
        guard let url = getHistoryURL(), let data = try? Data(contentsOf: url) else { return [] }
        if let saved = try? JSONDecoder().decode([ChatMessage].self, from: data) {
            return saved
        }
        return []
    }
}
