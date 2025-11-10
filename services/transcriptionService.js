import { PostFormData } from "./apiWrapper";

export default {
  transcribeAudio(data) {
    return new Promise((resolve, reject) => {
      PostFormData("/transcription/transcribe", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};

