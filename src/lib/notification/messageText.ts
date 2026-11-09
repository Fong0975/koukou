/**
 * Builds the message sent from the settings page to check that LINE is set up.
 *
 * @param sentAt - When the test is sent, shown in the server's local time.
 */
export function buildTestMessage(sentAt: string): string {
  return `✅ KouKou 測試訊息\nLINE 通知設定成功，提醒會傳送到這裡。\n傳送時間：${sentAt}`;
}
