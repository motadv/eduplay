export interface Question {
    type: "question";
    id: number;
    text: string;
    options: string[];
    correctAnswer: number;
    duration: number;
}

export interface Video {
    type: "video";
    src: string;
    duration: number;
}

export interface Room {           
    id: string;
    presenterId: string;
    players: any[];
    state: "waiting" | "countdown" | "video" | "question" | "results";
    results: { [key: string]: number };

    playlistIndex: number;
    currentQuestion: Question | null;
}