WITH DuplicateOptions AS (
    SELECT
        id,
        option,
        ROW_NUMBER() OVER (PARTITION BY option ORDER BY id) as rn
    FROM "AnswerOption"
),
     UniqueOptions AS (
         SELECT id, option FROM DuplicateOptions WHERE rn = 1
     ),
     ToDeleteOptions AS (
         SELECT id FROM DuplicateOptions WHERE rn > 1
     ),
     ToUpdateQuestionResults AS (
         SELECT qr.id as qr_id, uo.id as new_answer_id
         FROM "QuestionResult" qr
                  JOIN ToDeleteOptions tdo ON qr."answerId" = tdo.id
                  JOIN "AnswerOption" ao ON tdo.id = ao.id
                  JOIN UniqueOptions uo ON ao.option = uo.option
     )
UPDATE "QuestionResult"
SET "answerId" = tuqr.new_answer_id
FROM ToUpdateQuestionResults tuqr
WHERE "QuestionResult".id = tuqr.qr_id;


DELETE FROM "AnswerOption"
WHERE id IN (
    SELECT id
    FROM (
             SELECT id, option, ROW_NUMBER() OVER (PARTITION BY option ORDER BY id) as rn
             FROM "AnswerOption"
         ) as DuplicateOptions3
    WHERE rn > 1
);