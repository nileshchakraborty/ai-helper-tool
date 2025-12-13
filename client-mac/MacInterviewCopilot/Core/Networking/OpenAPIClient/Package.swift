// swift-tools-version:5.1

import PackageDescription

let package = Package(
    name: "OpenAPIClient",
    platforms: [
        .iOS(.v11),
        .macOS(.v10_13),
        .tvOS(.v11),
        .watchOS(.v4),
    ],
    products: [
        .library(
            name: "OpenAPIClient",
            targets: ["OpenAPIClient"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/Flight-School/AnyCodable", .upToNextMajor(from: "0.6.1")),
    ],
    targets: [
        .target(
            name: "OpenAPIClient",
            dependencies: ["AnyCodable", ],
            path: "OpenAPIClient/Classes"
        ),
    ]
)
