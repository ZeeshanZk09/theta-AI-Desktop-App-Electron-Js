import speech_recognition as sr

def live_stt():
    # Recognizer initialize karein
    r = sr.Recognizer()
    
    # Microphone setup
    with sr.Microphone() as source:
        print("\n--- Theta AI STT Test ---")
        print("Boliye, main sun raha hoon... (Ctrl+C to stop)")
        
        # Background noise adjust karein
        r.adjust_for_ambient_noise(source, duration=1)
        
        while True:
            try:
                # Audio capture
                audio = r.listen(source, phrase_time_limit=5)
                
                # Google Web Speech API use karte hue recognize karein
                # Note: Testing ke liye ye free hai
                text = r.recognize_google(audio)
                
                print(f"User: {text}")
                
            except sr.UnknownValueError:
                # Agar samajh na aye to ignore karein
                pass
            except sr.RequestError as e:
                print(f"Error: Connection issue ({e})")
            except KeyboardInterrupt:
                print("\nStopping STT Test...")
                break

if __name__ == "__main__":
    live_stt()
