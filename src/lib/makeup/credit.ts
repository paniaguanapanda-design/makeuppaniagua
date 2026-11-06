import { createServerFn } from "@tanstack/react-start";

export const trialCredit = createServerFn({ method: "GET" }).handler(async () => {
  const { creditContext } = await import("./credit.server");
  const { remainingCredit } = await import("./credit-store.server");
  const { sql, userId } = await creditContext();
  return { remaining: await remainingCredit(sql, userId), total: 3 };
});
