const OpenAI=require("openai")
const fs=require("fs")
const openai= new openAI({
    apiKey:"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"
})

 const audioFun=async()=>{
     const transcription=await openai.audio.transcriptions.create({
         file:fs.createReadStream("aud.mp3"),
        model:"whisper-1"
     })
     console.log(transcription.text)
 }
audioFun();