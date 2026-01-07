export function AppLogo({ size = 32 }: { size?: number }) {
    return (
        <div
            className="flex items-center justify-center rounded-full bg-[#F5B800]"
            style={{ width: size, height: size }}
        >
            <svg
                width={size * 0.75}
                height={size * 0.75}
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Center hexagon */}
                <path
                    d="M14 10L16.5 11.5V14.5L14 16L11.5 14.5V11.5L14 10Z"
                    fill="white"
                />
                {/* Top hexagon */}
                <path
                    d="M14 4L16.5 5.5V8.5L14 10L11.5 8.5V5.5L14 4Z"
                    fill="white"
                />
                {/* Top right hexagon */}
                <path
                    d="M19.5 7L22 8.5V11.5L19.5 13L17 11.5V8.5L19.5 7Z"
                    fill="white"
                />
                {/* Bottom right hexagon */}
                <path
                    d="M19.5 13L22 14.5V17.5L19.5 19L17 17.5V14.5L19.5 13Z"
                    fill="white"
                />
                {/* Bottom hexagon */}
                <path
                    d="M14 16L16.5 17.5V20.5L14 22L11.5 20.5V17.5L14 16Z"
                    fill="white"
                />
                {/* Bottom left hexagon */}
                <path
                    d="M8.5 13L11 14.5V17.5L8.5 19L6 17.5V14.5L8.5 13Z"
                    fill="white"
                />
                {/* Top left hexagon */}
                <path
                    d="M8.5 7L11 8.5V11.5L8.5 13L6 11.5V8.5L8.5 7Z"
                    fill="white"
                />
            </svg>
        </div>
    );
}
