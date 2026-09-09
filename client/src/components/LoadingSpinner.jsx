import React from "react";

function LoadingSpinner({ message = "Loading AI Insights..." }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                width: "100%",
                gap: "20px",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "64px",
                    height: "64px",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        border: "3px solid transparent",
                        borderTopColor: "var(--primary)",
                        borderRightColor: "var(--purple)",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        width: "48px",
                        height: "48px",
                        border: "3px solid transparent",
                        borderBottomColor: "var(--cyan)",
                        borderRadius: "50%",
                        animation: "spin 1.5s linear infinite reverse",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: "22px",
                        left: "22px",
                        width: "20px",
                        height: "20px",
                        background: "var(--gradient-primary)",
                        borderRadius: "50%",
                        boxShadow: "0 0 15px var(--primary)",
                        animation: "pulseGlow 2s ease infinite",
                    }}
                />
            </div>
            <p
                style={{
                    color: "var(--text-accent)",
                    fontWeight: "500",
                    letterSpacing: "0.02em",
                }}
            >
                {message}
            </p>
        </div>
    );
}

export default LoadingSpinner;
