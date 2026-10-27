import { Readable } from "node:stream";
import { db } from "@productscroll/database";
async function* rows<T extends { id: string }>(
  fetch: (after?: string) => Promise<T[]>,
) {
  let after: string | undefined;
  for (;;) {
    const page = await fetch(after);
    for (const row of page) yield row;
    if (page.length < 100) return;
    after = page.at(-1)!.id;
  }
}
async function* jsonArray<T>(source: AsyncIterable<T>) {
  yield "[";
  let first = true;
  for await (const row of source) {
    yield `${first ? "" : ","}${JSON.stringify(row)}`;
    first = false;
  }
  yield "]";
}
/** Pages the database and honors response backpressure without buffering the account. */
export function accountExport(userId: string, user: unknown) {
  const before = new Date();
  const options = (after?: string) => ({
    take: 100,
    orderBy: { id: "asc" as const },
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
  });
  return Readable.from(
    (async function* () {
      yield `{"exportedAt":${JSON.stringify(before)},"user":${JSON.stringify(user)},"posts":`;
      yield* jsonArray(
        rows((after) =>
          db.post.findMany({
            ...options(after),
            where: { authorId: userId, createdAt: { lte: before } },
          }),
        ),
      );
      yield ',"saves":';
      yield* jsonArray(
        rows((after) =>
          db.save.findMany({
            ...options(after),
            where: { userId, createdAt: { lte: before } },
          }),
        ),
      );
      // This relation uses a compound key instead of an ID.
      yield ',"follows":[';
      let followerCursor: string | undefined,
        firstFollow = true;
      for (;;) {
        const page = await db.userFollow.findMany({
          where: {
            followerId: userId,
            followingId: followerCursor ? { gt: followerCursor } : undefined,
          },
          orderBy: { followingId: "asc" },
          take: 100,
        });
        for (const row of page) {
          yield `${firstFollow ? "" : ","}${JSON.stringify(row)}`;
          firstFollow = false;
        }
        if (page.length < 100) break;
        followerCursor = page.at(-1)!.followingId;
      }
      yield '],"messages":';
      yield* jsonArray(
        rows((after) =>
          db.message.findMany({
            ...options(after),
            where: { senderId: userId, createdAt: { lte: before } },
            select: {
              id: true,
              conversationId: true,
              body: true,
              createdAt: true,
            },
          }),
        ),
      );
      yield ',"collections":[';
      let firstCollection = true;
      for await (const collection of rows((after) =>
        db.collection.findMany({ ...options(after), where: { userId } }),
      )) {
        yield `${firstCollection ? "" : ","}${JSON.stringify(collection).slice(0, -1)},"items":[`;
        firstCollection = false;
        let itemCursor: string | undefined,
          firstItem = true;
        for (;;) {
          const page = await db.collectionItem.findMany({
            where: {
              collectionId: collection.id,
              saveId: itemCursor ? { gt: itemCursor } : undefined,
            },
            orderBy: { saveId: "asc" },
            take: 100,
          });
          for (const row of page) {
            yield `${firstItem ? "" : ","}${JSON.stringify(row)}`;
            firstItem = false;
          }
          if (page.length < 100) break;
          itemCursor = page.at(-1)!.saveId;
        }
        yield "]}";
      }
      yield "]}";
    })(),
  );
}
