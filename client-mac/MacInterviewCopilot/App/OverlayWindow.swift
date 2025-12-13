import Cocoa
import SwiftUI

public class OverlayWindow: NSWindow {
    private var isClickThrough = false
    private var opacityLevel: CGFloat = 1.0
    private let opacityLevels: [CGFloat] = [1.0, 0.8, 0.6, 0.4]
    
    public init() {
        super.init(
            contentRect: NSRect(x: 0, y: 0, width: 800, height: 600),
            styleMask: [.borderless, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        
        // Window behavior
        self.isOpaque = false
        self.backgroundColor = .clear
        self.title = "Panel" // Stealth: Generic title for WindowServer/Mission Control
        
        // CRITICAL: Use maximum window level to stay above ALMOST EVERYTHING including full screen apps
        // Window levels (low to high): normal < floating < modalPanel < statusBar < screenSaver < maximum
        // .maximum ensures window stays above Zoom, Teams, Google Meet, and native fullscreen apps
        // Note: We cast to NSWindow.Level because CGWindowLevel key returns Int32/CGWindowLevel
        self.level = NSWindow.Level(Int(CGWindowLevelForKey(.maximumWindow)))
        
        // Collection behavior for all spaces and fullscreen compatibility
        self.collectionBehavior = [
            .canJoinAllSpaces,        // Visible on all desktops
            .fullScreenAuxiliary,      // Works alongside fullscreen apps
            .stationary,               // Doesn't move with workspace animations
            .ignoresCycle              // Cmd+Tab won't switch to this window
        ]
        
        // Visual styling
        self.backgroundColor = .clear
        self.hasShadow = true
        self.isOpaque = false
        
        // CRITICAL: Exclude from screen sharing, Zoom, and proctoring tools
        // .none = window NOT captured by:
        // - Screen recording (QuickTime, OBS)
        // - Screen sharing (Zoom, Teams, Meet)
        // - Screenshot APIs (CGWindowListCreateImage)
        // - Proctoring software (HackerRank, ProctorU)
        self.sharingType = .none
        
        // Additional stealth settings
        self.hidesOnDeactivate = false  // Stay visible when app loses focus
        self.animationBehavior = .none   // No animation effects
        self.isMovableByWindowBackground = true  // Easy dragging
        
        // Prevent window from being minimized or hidden during calls
        self.canHide = false
    }
    
    // Toggle click-through mode (Cmd+Shift+T)
    // Toggle click-through mode (Cmd+Shift+T)
    public func toggleClickThrough() {
        isClickThrough.toggle()
        self.ignoresMouseEvents = isClickThrough
        
        // Visual feedback: reduce opacity when click-through is enabled
        if isClickThrough {
            self.alphaValue = 0.5
        } else {
            self.alphaValue = opacityLevel
        }
    }
    
    // Cycle through opacity levels (Cmd+Shift+O)
    public func cycleOpacity() {
        guard !isClickThrough else { return } // Don't cycle when click-through is active
        
        if let currentIndex = opacityLevels.firstIndex(of: opacityLevel) {
            let nextIndex = (currentIndex + 1) % opacityLevels.count
            opacityLevel = opacityLevels[nextIndex]
        } else {
            opacityLevel = opacityLevels[0]
        }
        self.alphaValue = opacityLevel
    }
    
    // Set specific opacity
    public func setOpacity(_ opacity: CGFloat) {
        opacityLevel = max(0.2, min(1.0, opacity))
        if !isClickThrough {
            self.alphaValue = opacityLevel
        }
    }
    
    public override var canBecomeKey: Bool {
        return true
    }
    
    public override var canBecomeMain: Bool {
        return true
    }
    
    // Force window level maintenance when ordering front
    public override func orderFront(_ sender: Any?) {
        self.level = NSWindow.Level(Int(CGWindowLevelForKey(.maximumWindow)))
        super.orderFront(sender)
    }
    
    public override func makeKeyAndOrderFront(_ sender: Any?) {
        self.level = NSWindow.Level(Int(CGWindowLevelForKey(.maximumWindow)))
        super.makeKeyAndOrderFront(sender)
    }
}
