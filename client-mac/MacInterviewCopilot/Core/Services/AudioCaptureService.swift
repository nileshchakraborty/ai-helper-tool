import Foundation
import AVFoundation

public class AudioCaptureService: NSObject {
    private let engine = AVAudioEngine()
    
    public override init() {
        super.init()
    }
    
    public func start() throws {
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, time in
            // Analyze audio or buffer for streaming
        }
        
        try engine.start()
    }
    
    public func stop() {
        engine.stop()
        engine.inputNode.removeTap(onBus: 0)
    }
}
