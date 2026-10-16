// @vitest-environment node
import { describe, expect, it } from "vitest";
import { describeDatabaseUrl } from "./databaseUrl";

describe("describeDatabaseUrl", () => {
  const tests = [
    {
      name: "host, port and database without credentials",
      url: "mysql://koukou:secret@db.example.com:3306/koukou",
      expected: { host: "db.example.com:3306", database: "koukou" },
    },
    {
      name: "decodes the database name",
      url: "mysql://u:p@localhost/my%20db",
      expected: { host: "localhost", database: "my db" },
    },
    { name: "no database", url: "mysql://localhost", expected: { host: "localhost", database: undefined } },
    { name: "unparseable URL", url: "not a url", expected: {} },
    { name: "malformed escape in the database name", url: "mysql://localhost/%E0%A4%A", expected: {} },
  ];

  for (const tt of tests) {
    it(tt.name, () => {
      const result = describeDatabaseUrl(tt.url);
      expect(result).toEqual(tt.expected);
      expect(JSON.stringify(result)).not.toContain("secret");
    });
  }
});
