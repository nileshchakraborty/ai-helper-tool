import Foundation
import ScreenCaptureKit
import CoreGraphics
import AppKit

public class ScreenCaptureService: NSObject {
    private var stream: SCStream?
    
    public override init() {
        super.init()
    }
    
    public func captureSnapshot(window: SCWindow? = nil) async throws -> Data {
        let content = try await SCShareableContent.current
        
        let filter: SCContentFilter
        let width: Int
        let height: Int
        
        if let targetWindow = window {
            filter = SCContentFilter(desktopIndependentWindow: targetWindow)
            width = Int(targetWindow.frame.width)
            height = Int(targetWindow.frame.height)
        } else {
             // Fallback to first display
            guard let display = content.displays.first else {
                throw NSError(domain: "ScreenCaptureService", code: 1, userInfo: [NSLocalizedDescriptionKey: "No display found"])
            }
            filter = SCContentFilter(display: display, excludingWindows: [])
            width = display.width
            height = display.height
        }
        
        let conf = SCStreamConfiguration()
        conf.width = width
        conf.height = height
        conf.minimumFrameInterval = CMTime(value: 1, timescale: 60)
        conf.showsCursor = false
        
        // Use SCScreenshotManager if available (macOS 14.0+)
        if #available(macOS 14.0, *) {
            let cgImage = try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: conf)
            return imageToData(cgImage)
        } else {
            // Fallback for older macOS versions (simplified stream capture)
            // This is a complex fallback, for now we will throw if < macOS 14 regarding this specific verified path
            // or return a placeholder to avoid breaking the app on older OS.
            print("SCScreenshotManager requires macOS 14.0+")
            return Data()
        }
    }
    
    private func imageToData(_ cgImage: CGImage) -> Data {
        let bitmapRep = NSBitmapImageRep(cgImage: cgImage)
        return bitmapRep.representation(using: .jpeg, properties: [:]) ?? Data()
    }
}
