import cv2
import sounddevice as sd
import soundfile as sf
import numpy as np
import threading
import time

# =========================
# SETTINGS
# =========================

AUDIO_FILE = "recorded_audio.wav"
VIDEO_FILE = "recorded_video.avi"

SAMPLE_RATE = 44100
CHANNELS = 1

recording = False
audio_data = []


# =========================
# AUDIO RECORDING
# =========================

def audio_callback(indata, frames, time_info, status):
    if status:
        print(status)

    if recording:
        audio_data.append(indata.copy())


def start_audio_stream():
    stream = sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        callback=audio_callback
    )

    stream.start()

    return stream


# =========================
# MAIN PROGRAM
# =========================

def main():

    global recording
    global audio_data

    # Open camera
    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("Error: Cannot access camera")
        return

    # Get camera resolution
    width = int(camera.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(camera.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Video writer
    fourcc = cv2.VideoWriter_fourcc(*"XVID")

    video_writer = cv2.VideoWriter(
        VIDEO_FILE,
        fourcc,
        20.0,
        (width, height)
    )

    print("Starting microphone...")

    # Start microphone stream
    audio_stream = start_audio_stream()

    print("\nCamera and Microphone Access Program Started")
    print("--------------------------------------------")
    print("Press R = Start/Stop Recording")
    print("Press Q = Quit")
    print("--------------------------------------------")

    while True:

        success, frame = camera.read()

        if not success:
            print("Error: Cannot read camera")
            break

        # Show recording status
        if recording:

            cv2.putText(
                frame,
                "RECORDING",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2
            )

            # Save video frame
            video_writer.write(frame)

        else:

            cv2.putText(
                frame,
                "Camera Active - Press R to Record",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2
            )

        # Display camera
        cv2.imshow(
            "Camera and Microphone Access",
            frame
        )

        key = cv2.waitKey(1) & 0xFF

        # Press R
        if key == ord("r"):

            if not recording:

                recording = True
                audio_data = []

                print("Recording started...")

            else:

                recording = False

                print("Recording stopped.")

        # Press Q
        elif key == ord("q"):

            break


    # Stop recording
    recording = False

    # Stop microphone
    audio_stream.stop()
    audio_stream.close()

    # Release camera
    camera.release()

    # Release video
    video_writer.release()

    cv2.destroyAllWindows()


    # =========================
    # SAVE AUDIO
    # =========================

    if len(audio_data) > 0:

        audio_array = np.concatenate(
            audio_data,
            axis=0
        )

        sf.write(
            AUDIO_FILE,
            audio_array,
            SAMPLE_RATE
        )

        print("\nAudio saved as:", AUDIO_FILE)

    else:

        print("\nNo audio recording found.")

    print("Video saved as:", VIDEO_FILE)


if __name__ == "__main__":
    main()