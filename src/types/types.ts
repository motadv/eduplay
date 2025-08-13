export interface Question {
    text: string;
    options: string[];
    correctAnswer: number;
}

export interface Room {           
    id: string;
    presenterId: string;
    players: string[];
    state: "waiting" | "countdown" | "video" | "question";
    results: { [key: string]: number };

    playlistIndex: number;
}