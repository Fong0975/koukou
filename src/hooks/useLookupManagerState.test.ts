import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { flushPromises } from "@/test/async";
import { useLookupManagerState } from "./useLookupManagerState";

type State = ReturnType<typeof useLookupManagerState<{ id: number }>>;

describe("useLookupManagerState", () => {
  const item = { id: 4 };
  const tests: {
    name: string;
    onMove?: () => Promise<void>;
    act: (state: State) => void | Promise<void>;
    expected: { editingId: number | null; deleting: { id: number } | null; moveError: string | null };
    expectedMoves?: unknown[][];
  }[] = [
    {
      name: "starts editing a row",
      act: (state) => state.startEditing(4),
      expected: { editingId: 4, deleting: null, moveError: null },
    },
    {
      name: "starts deleting a row",
      act: (state) => state.startDeleting(item),
      expected: { editingId: null, deleting: item, moveError: null },
    },
    {
      name: "moves a row",
      act: async (state) => {
        state.move(4, -1);
        await flushPromises();
      },
      expected: { editingId: null, deleting: null, moveError: null },
      expectedMoves: [[4, -1]],
    },
    {
      name: "keeps the error of a failed move",
      onMove: () => Promise.reject(new Error("移動失敗")),
      act: async (state) => {
        state.move(4, 1);
        await flushPromises();
      },
      expected: { editingId: null, deleting: null, moveError: "移動失敗" },
      expectedMoves: [[4, 1]],
    },
  ];

  for (const tt of tests) {
    it(tt.name, async () => {
      const onMove = vi.fn(tt.onMove ?? (() => Promise.resolve()));
      const { result } = renderHook(() => useLookupManagerState<{ id: number }>(onMove));

      await act(async () => {
        await tt.act(result.current);
      });

      expect({
        editingId: result.current.editingId,
        deleting: result.current.deleting,
        moveError: result.current.moveError,
      }).toEqual(tt.expected);
      expect(onMove.mock.calls).toEqual(tt.expectedMoves ?? []);
    });
  }
});
