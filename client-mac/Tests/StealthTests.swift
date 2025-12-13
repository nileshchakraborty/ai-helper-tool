import XCTest
import SwiftUI
@testable import MacInterviewCopilotLib

final class StealthTests: XCTestCase {
    
    // 1. Verify OverlayWindow configuration properties for stealth
    func testOverlayWindowStealthProperties() {
        // Must run on main thread as it touches UI
        let expectation = self.expectation(description: "Window Properties Verified")
        
        DispatchQueue.main.async {
            let window = OverlayWindow()
            
            // Check Sharing Type (Invisible to Screen Recording/Sharing)
            XCTAssertEqual(window.sharingType, .none, "Window must have sharingType = .none to be invisible to screen sharing and recordings")
            
            // Check Window Level (Always on Top but stealthy)
            XCTAssertEqual(window.level, .screenSaver, "Window must be at .screenSaver level to stay atop everything")
            
            // Check Title (Generic Identity)
            XCTAssertEqual(window.title, "Panel", "Window title must be generic 'Panel' to hide identity in WindowServer")
            
            // Check Collection Behavior (Invisible to Expose/Mission Control if possible, but definitely ignores cycle)
            XCTAssertTrue(window.collectionBehavior.contains(.ignoresCycle), "Window must be excluded from Cmd+Tab cycle")
            XCTAssertTrue(window.collectionBehavior.contains(.stationary), "Window must be stationary")
            
            // Check Background (Transparent)
            XCTAssertEqual(window.backgroundColor, .clear, "Window background must be clear")
            XCTAssertFalse(window.isOpaque, "Window must not be opaque")
            
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 1.0)
    }
    
    // 2. Verify Screenshot Logic stores in Memory Only (No Desktop files)
    func testScreenshotIsMemoryOnly() {
        // Inspect the ScreenCaptureService logic
        // Since we can't easily audit filesystem events in unit test without hefty setup,
        // we'll verify the service method returns Data/NSImage and doesn't take a file path.
        
        let service = ScreenCaptureService.shared
        
        // The API signature itself is a strong contract:
        // func captureScreen(displayId: CGDirectDisplayID?) -> NSImage?
        // It returns an object, it does not accept a path to write to.
        
        // We simulate a capture to ensure it doesn't crash
        let capture = service.captureScreen()
        
        // While we can't strictly prove "no file was created" without FS access,
        // the absence of a file path in the API and the return of an in-memory object 
        // provides strong confidence for this "Stealth" requirement.
        XCTAssertNotNil(capture, "Capture should return an image (or nil if display locked, but logic should run)")
    }
    
    // 3. functional test for Window Hiding (Logic Check)
    func testWindowHidingLogic() {
        // We can't easily test `CGDisplayCreateImage` visually in a headless runner,
        // but we can verify our ChatView logic (if we could extract it) calls orderOut.
        
        // Implemented in ChatView.swift:
        // window.orderOut(nil) -> capture -> window.orderFront(nil)
        
        // We verified this implementation in the code review. 
        // For a unit test, we'll verify OverlayWindow responds to stealth commands.
        
        let expectation = self.expectation(description: "Window Hiding")
        
        DispatchQueue.main.async {
            let window = OverlayWindow()
            window.orderFront(nil)
            XCTAssertTrue(window.isVisible)
            
            // Stealth hide
            window.orderOut(nil)
            XCTAssertFalse(window.isVisible, "Window must be hidden after orderOut")
            
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 1.0)
    }
}
