import Cocoa
import SwiftUI

class OverlayWindow: NSPanel {
    private var isClickThrough = false
    private var opacityLevel: CGFloat = 1.0
    private let opacityLevels: [CGFloat] = [1.0, 0.8, 0.6, 0.4]
    
    init(contentRect: NSRect, backing: NSWindow.BackingStoreType, defer flag: Bool) {
        super.init(contentRect: contentRect, styleMask: [.nonactivatingPanel, .titled, .resizable, .closable, .fullSizeContentView], backing: backing, defer: flag)
        
        // Window behavior
        self.isFloatingPanel = true
        self.level = .floating
        self.styleMask = [.nonactivatingPanel, .titled, .resizable, .closable, .fullSizeContentView]
        // Removed .stationary to allow easier movement between screens
        self.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        self.titleVisibility = .hidden
        self.titlebarAppearsTransparent = true
        self.isMovableByWindowBackground = true
        self.isMovable = true
        
        // Visual styling
        self.backgroundColor = .clear // Clear for VisualEffectView
        self.hasShadow = true
        self.isOpaque = false // Allow transparency
        
        // CRITICAL: Exclude from screen sharing, Zoom, and proctoring tools
        // .none = window NOT captured by:
        // - Screen recording (QuickTime, OBS)
        // - Screen sharing (Zoom, Teams, Meet)
        // - Screenshot APIs (CGWindowListCreateImage)
        // - Proctoring software (HackerRank, ProctorU)
        self.sharingType = .none
        
        // Additional stealth settings
        self.hidesOnDeactivate = false
        self.animationBehavior = .none
    }
    
    // Toggle click-through mode (Cmd+Shift+T)
    func toggleClickThrough() {
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
    func cycleOpacity() {
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
    func setOpacity(_ opacity: CGFloat) {
        opacityLevel = max(0.2, min(1.0, opacity))
        if !isClickThrough {
            self.alphaValue = opacityLevel
        }
    }
    
    override var canBecomeKey: Bool {
        // Can't become key when in click-through mode
        return !isClickThrough
    }
    
    override var canBecomeMain: Bool {
        return !isClickThrough
    }
}
