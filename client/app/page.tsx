import AudioRecorder from "@/components/AudioRecorder";

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">OpenAI Realtime Voice Chat</h1>
      <AudioRecorder />
    </div>
  );
}
