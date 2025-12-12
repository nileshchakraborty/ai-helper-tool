import XCTest
@testable import MacInterviewCopilotLib

final class ScreenCaptureTests: XCTestCase {
    
    func testListDisplays() {
        let service = ScreenCaptureService.shared
        service.refreshDisplays()
        XCTAssertFalse(service.availableDisplays.isEmpty, "Should find at least one display")
    }
    
    func testSelectDisplay() {
        let service = ScreenCaptureService.shared
        service.refreshDisplays()
        guard let first = service.availableDisplays.first else { return }
        
        service.selectedDisplayID = first
        XCTAssertEqual(service.selectedDisplayID, first, "Should update selected display")
    }
    
    func testCaptureWithSelection() {
        let service = ScreenCaptureService.shared
        service.refreshDisplays()
        
        // Capture main
        let image1 = service.captureScreen()
        XCTAssertNotNil(image1)
        
        // Explicit ID
        if let first = service.availableDisplays.first {
            let image2 = service.captureScreen(displayId: first)
            XCTAssertNotNil(image2)
        }
    }
}
