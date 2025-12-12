import Foundation
import AppKit
import CoreGraphics
import SwiftUI

public class ScreenCaptureService: NSObject, ObservableObject {
    public static let shared = ScreenCaptureService()
    
    @Published public var lastCapture: NSImage?
    @Published public var error: String?
    @Published public var availableDisplays: [CGDirectDisplayID] = []
    @Published public var selectedDisplayID: CGDirectDisplayID = CGMainDisplayID()
    
    override private init() {
        super.init()
        refreshDisplays()
    }
    
    public func refreshDisplays() {
        self.availableDisplays = listDisplays()
        if !self.availableDisplays.contains(self.selectedDisplayID) {
            self.selectedDisplayID = CGMainDisplayID()
        }
    }
    
    /// List all active displays
    public func listDisplays() -> [CGDirectDisplayID] {
        var displayCount: UInt32 = 0
        CGGetActiveDisplayList(0, nil, &displayCount)
        
        var displays = [CGDirectDisplayID](repeating: 0, count: Int(displayCount))
        CGGetActiveDisplayList(displayCount, &displays, &displayCount)
        
        return displays
    }

    /// Capture a specific display or default to main
    public func captureScreen(displayId: CGDirectDisplayID? = nil) -> NSImage? {
        self.error = nil
        let targetID = displayId ?? selectedDisplayID
        
        guard let cgImage = CGDisplayCreateImage(targetID) else {
            self.error = "Failed to capture display \(targetID)"
            return nil
        }
        let image = NSImage(cgImage: cgImage, size: NSSize(width: cgImage.width, height: cgImage.height))
        self.lastCapture = image
        return image
    }
}
