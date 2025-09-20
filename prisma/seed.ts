import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
    try {
        // 質問と選択肢のデータ
        const questionsData = [
            {
                content: "好きな行事は？",
                isAdult: false,
                options: {
                    create: [
                        { content: "お花見" },
                        { content: "花火大会" },
                        { content: "ハロウィン" },
                        { content: "クリスマス" },
                        { content: "バレンタイン" },
                        { content: "お正月" }
                    ]
                }
            },
            {
                content: "あなたは何派？",
                isAdult: false,
                options: {
                    create: [
                        { content: "パン" },
                        { content: "ごはん" },
                        { content: "麺" }
                    ]
                }
            },
            {
                content: "好きな季節は？",
                isAdult: false,
                options: {
                    create: [
                        { content: "春" },
                        { content: "夏" },
                        { content: "秋" },
                        { content: "冬" }
                    ]
                }
            },
            {
                content: "お祭りの屋台でまず食べるものは？",
                isAdult: false,
                options: {
                    create: [
                        { content: "チョコバナナ" },
                        { content: "やきそば" },
                        { content: "綿あめ" },
                        { content: "イカ焼き" }
                    ]
                }
            },
            {
                content: "今日はだれときた？",
                isAdult: false,
                options: {
                    create: [
                        { content: "家族" },
                        { content: "友達" },
                        { content: "1人" }
                    ]
                }
            },
            {
                content: "ペットとして買いたいのは？",
                isAdult: false,
                options: {
                    create: [
                        { content: "サカナ" },
                        { content: "カメ" },
                        { content: "ウサギ" },
                        { content: "カエル" }
                    ]
                }
            },
            {
                content: "どの縁日で遊びたい？？",
                isAdult: false,
                options: {
                    create: [
                        { content: "射的" },
                        { content: "金魚すくい" },
                        { content: "ヨーヨーすくい" },
                        { content: "輪投げ" }
                    ]
                }
            }
        ];

        // データを順番に作成
        for (const questionData of questionsData) {
            await prisma.questions.create({
                data: questionData
            });
        }

        console.log('シードデータの投入が完了しました');
    } catch (error) {
        console.error('エラーが発生しました:', error);
        throw error;
    }
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
