import Foundation
import CoreGraphics
import AppKit

class ScreenCaptureManager {
    static let shared = ScreenCaptureManager()
    
    private init() {}
    
    /// Captures the entire main display
    func captureMainDisplay() -> CGImage? {
        // CGWindowListCreateImage is deprecated in macOS 14.0 but simplest for now.
        // Alternative: ScreenCaptureKit (requires async stream even for single shot).
        // Sticking to CGWindowList for simple OCR snapshot.
        let mainDisplayBounds = CGDisplayBounds(CGMainDisplayID())
        return CGWindowListCreateImage(mainDisplayBounds, .optionOnScreenOnly, kCGNullWindowID, .bestResolution)
    }
    
    /// Captures a specific window by ID
    func captureWindow(windowID: CGWindowID) -> CGImage? {
        return CGWindowListCreateImage(.null, .optionIncludingWindow, windowID, .bestResolution)
    }
    
    func checkScreenRecordingPermission() -> Bool {
        return CGPreflightScreenCaptureAccess()
    }
    
    @discardableResult
    func requestScreenRecordingPermission() -> Bool {
        return CGRequestScreenCaptureAccess()
    }
}
