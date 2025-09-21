import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
    try {
        // 前回のデータを全削除しIDをリセット
        await prisma.$executeRawUnsafe(
            'TRUNCATE TABLE "options", "questions" RESTART IDENTITY CASCADE;'
        );

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
                content: "ペットとして飼いたいのは？",
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
                content: "どの縁日で遊びたい？",
                isAdult: false,
                options: {
                    create: [
                        { content: "射的" },
                        { content: "金魚すくい" },
                        { content: "ヨーヨーすくい" },
                        { content: "輪投げ" }
                    ]
                }
            },
            // 大人用
            {
                content: "一番思い出に残っている季節のイベントは？",
                isAdult: true,
                options: {
                    create: [
                        { content: "初恋の夏祭り" },
                        { content: "大学の文化祭" },
                        { content: "成人式" },
                        { content: "クリスマス" },
                        { content: "中高の同窓会" },
                        { content: "家族とのお正月" }
                    ]
                }
            },
            {
                content: "休日の過ごし方は？",
                isAdult: true,
                options: {
                    create: [
                        { content: "家でのんびり" },
                        { content: "ドライブ・旅行" },
                        { content: "飲み歩き" }
                    ]
                }
            },
            {
                content: "好きな季節の楽しみは？",
                isAdult: true,
                options: {
                    create: [
                        { content: "春（花見）" },
                        { content: "夏（海・花火）" },
                        { content: "秋（紅葉・食欲）" },
                        { content: "冬（鍋・温泉）" }
                    ]
                }
            },
            {
                content: "屋台・縁日でまず手に取るものは？",
                isAdult: true,
                options: {
                    create: [
                        { content: "焼き鳥" },
                        { content: "たこ焼き" },
                        { content: "ビール" },
                        { content: "かき氷" }
                    ]
                }
            },
            {
                content: "誰と過ごした時間が一番印象に残ってる？",
                isAdult: true,
                options: {
                    create: [
                        { content: "学生時代の友達" },
                        { content: "初恋の人" },
                        { content: "家族" }
                    ]
                }
            },
            {
                content: "ペットとして飼いたいのは？",
                isAdult: true,
                options: {
                    create: [
                        { content: "犬" },
                        { content: "猫" },
                        { content: "金魚" },
                        { content: "小鳥" }
                    ]
                }
            },
            {
                content: "余暇にやりたいことは？",
                isAdult: true,
                options: {
                    create: [
                        { content: "ゴルフ" },
                        { content: "カラオケ" },
                        { content: "温泉旅行" },
                        { content: "花火大会" }
                    ]
                }
            },
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
