import XCTest
@testable import MacInterviewCopilotLib

final class PersistenceTests: XCTestCase {
    
    func testSaveAndLoad() {
        let service = PersistenceService.shared
        // Clean up or use mock if possible, but for integration test use real FS
        // We assume test environment has write access
        
        let msg = ChatMessage(role: "user", content: "Test Persistence")
        service.saveHistory([msg])
        
        // Wait? No, sync.
        let loaded = service.loadHistory()
        XCTAssertFalse(loaded.isEmpty)
        XCTAssertEqual(loaded.last?.content, "Test Persistence")
    }
}
