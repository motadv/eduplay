import { Question, Video } from "types/types";

const playlist: Array<Video | Question> = [
  { type: "video", src: "media/eduplay/videos/p1.mp4", duration: 57 },
  {
    type: "question",
    id: 1,
    text: "A paisagem dos Lençóis Maranhenses ____ cheia de dunas e lagoas cristalinas, um cenário incrível! Qual a forma correta de completar essa frase?",
    options: ["estar", "está", "estár", "esta"],
    correctAnswer: 1,
    duration: 17,
  },
  { type: "video", src: "media/eduplay/videos/p2_cut.mp4", duration: 58 },
  {
    type: "question",
    id: 2,
    text: "Os Lençóis Maranhenses são lindos, _____ é importante ir na época certa para ver as lagoas cheias.",
    options: ["mas", "mais", "maís", "más"],
    correctAnswer: 0,
    duration: 17,
  },
  {type: "video", src: "media/eduplay/videos/outro.mp4", duration: 40},
];

export default playlist;
