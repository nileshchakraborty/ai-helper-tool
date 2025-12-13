import Foundation
import Vision
import CoreGraphics
import AppKit

class OCRService {
    static let shared = OCRService()
    
    private init() {}
    
    /// Extracts text from a CGImage using Vision framework
    func recognizeText(from image: CGImage) async throws -> String {
        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error = error {
                    continuation.resume(throwing: error)
                    return
                }
                
                guard let observations = request.results as? [VNRecognizedTextObservation] else {
                    continuation.resume(returning: "")
                    return
                }
                
                let recognizedStrings = observations.compactMap { observation in
                    // Ask for the top candidate
                    return observation.topCandidates(1).first?.string
                }
                
                let joinedText = recognizedStrings.joined(separator: "\n")
                continuation.resume(returning: joinedText)
            }
            
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true // Better for code/sentences
            
            let handler = VNImageRequestHandler(cgImage: image, options: [:])
            
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
    
    /// Convenience method for NSImage
    func recognizeText(from image: NSImage) async throws -> String {
        guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
            throw NSError(domain: "OCRService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Could not convert NSImage to CGImage"])
        }
        return try await recognizeText(from: cgImage)
    }
}
