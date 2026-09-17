import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useConfig } from "../hooks/use-config";
import { useCredits } from "../hooks/use-credits";
import { useModelDirectory } from "../hooks/use-model-directory";
import { useBackendSession } from "../hooks/use-backend-session";
import {
  buildMessageContent,
  streamChat,
  type ChatMessage,
} from "../lib/api/chat";
import type { CreditAsset } from "../lib/api/credits";
import type { DirectoryModel } from "../lib/api/models";
import { ACCEPT_ATTR, fileToInlineImage } from "../lib/images";
import { SuccessOverlay } from "./success-check";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  error?: boolean;
};

function newId() {
  return Math.random().toString(36).slice(2);
}

const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: UiMessage;
}) {
  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
          message.role === "user"
            ? "bg-black text-white"
            : message.error
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-black/10 bg-white text-black"
        }`}
      >
        {message.images && message.images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.images.map((src, index) => (
              <img
                key={index}
                src={src}
                alt="attachment"
                className="max-h-48 rounded-lg border border-white/20 object-cover"
              />
            ))}
          </div>
        )}
        {message.content ? (
          message.content
        ) : message.images && message.images.length > 0 ? null : (
          <span className="pixel-sans text-black/40">Thinking…</span>
        )}
      </div>
    </div>
  );
});

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (value === 0) return "$0.00";
  if (value < 0.01) {
    return `$${value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
  }
  return `$${value.toFixed(2)}`;
}

function formatPerM(perM: number | null): string {
  if (perM === null) return "—";
  if (perM === 0) return "Free";
  if (perM < 1) return `$${perM.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;
  return `$${perM.toFixed(2)}`;
}

function ModelPicker({
  models,
  selectedId,
  onSelect,
}: {
  models: DirectoryModel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = models.find((m) => m.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? models.filter(
          (m) =>
            m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
        )
      : models;
    return base.slice(0, 60);
  }, [models, query]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pixel-sans flex w-full items-center justify-between gap-2 rounded-xl border border-black/15 bg-white px-3 py-2 text-left text-sm hover:border-black/30"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selected ? (
            <>
              <span className="truncate text-black">{selected.name}</span>
              {selected.inputModalities.includes("image") && (
                <span className="pixel-sans shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                  Vision
                </span>
              )}
            </>
          ) : (
            <span className="text-black/40">Select a model…</span>
          )}
        </span>
        <span className="shrink-0 text-black/40">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-80 w-full overflow-hidden rounded-xl border border-black/15 bg-white shadow-lg">
          <div className="border-b border-black/10 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models…"
              className="pixel-sans w-full rounded-lg border border-black/10 bg-black/[0.02] px-3 py-1.5 text-sm outline-none focus:border-black/30"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="pixel-sans px-3 py-3 text-sm text-black/40">
                No models match “{query}”.
              </div>
            )}
            {filtered.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onSelect(model.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-black/[0.04] ${
                  model.id === selectedId ? "bg-emerald-50" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="pixel-sans truncate text-sm text-black">
                      {model.name}
                    </span>
                    {model.inputModalities.includes("image") && (
                      <span className="pixel-sans shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                        Vision
                      </span>
                    )}
                  </div>
                  <div className="pixel-mono truncate text-[11px] text-black/40">
                    {model.id}
                  </div>
                </div>
                <div className="pixel-sans shrink-0 text-right text-[11px] text-black/50">
                  {model.isFree ? (
                    <span className="text-emerald-700">Free</span>
                  ) : (
                    <>
                      <div>In {formatPerM(model.promptPerM)}/M</div>
                      <div>Out {formatPerM(model.completionPerM)}/M</div>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TopUpModal({
  open,
  onClose,
  onConfirm,
  minUsd,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (usd: number, asset: CreditAsset) => Promise<void>;
  minUsd: number;
  busy: boolean;
}) {
  const [usd, setUsd] = useState("10");
  const [asset, setAsset] = useState<CreditAsset>("AUTO");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const amount = Number(usd);
  const valid = Number.isFinite(amount) && amount >= minUsd;

  const submit = async () => {
    setError(null);
    if (!valid) {
      setError(`Minimum top-up is $${minUsd}.`);
      return;
    }
    try {
      await onConfirm(amount, asset);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top-up failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="pixel-serif text-lg text-black">Add chat credits</h2>
          <button
            type="button"
            onClick={onClose}
            className="pixel-sans text-black/40 hover:text-black"
          >
            ✕
          </button>
        </div>

        <label className="pixel-sans mb-1 block text-xs text-black/50">
          Amount (USD)
        </label>
        <input
          type="number"
          min={minUsd}
          value={usd}
          onChange={(e) => setUsd(e.target.value)}
          className="pixel-sans mb-4 w-full rounded-xl border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40"
        />

        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["AUTO", "USDC"] as CreditAsset[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAsset(option)}
              className={`pixel-sans rounded-xl border px-3 py-2 text-sm transition-colors ${
                asset === option
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-black/15 text-black/60 hover:border-black/30"
              }`}
            >
              Pay with {option === "AUTO" ? "$AUTO" : "USDG"}
            </button>
          ))}
        </div>

        {error && (
          <p className="pixel-sans mb-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || !valid}
          className="pixel-sans w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Processing…" : `Buy ${formatUsd(amount || 0)} credits`}
        </button>
        <p className="pixel-sans mt-3 text-center text-[11px] text-black/40">
          {asset === "AUTO"
            ? "$AUTO is valued at the live oracle price at deposit."
            : "USDG is credited 1:1."}
        </p>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { config } = useConfig();
  const { directory } = useModelDirectory();
  const { authenticated, hasSession, syncing, syncSession } =
    useBackendSession();
  const { balance, toppingUp, topUp, applyBalanceMicro, refresh } =
    useCredits();

  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [sending, setSending] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Only auto-scroll while the user is parked near the bottom, so scrolling up
  // to read earlier messages mid-stream doesn't get yanked back down.
  const pinnedToBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedToBottomRef.current = distanceFromBottom < 80;
  }, []);

  // Chargeable models only (skip variable-priced; backend rejects those).
  const chatModels = useMemo(
    () => directory.models.filter((m) => !m.isVariablePrice),
    [directory.models],
  );

  useEffect(() => {
    if (!selectedModel && chatModels.length > 0) {
      const preferred =
        chatModels.find((m) => m.available && !m.isFree) ?? chatModels[0];
      setSelectedModel(preferred.id);
    }
  }, [chatModels, selectedModel]);

  const supportsImages = useMemo(() => {
    const model = chatModels.find((m) => m.id === selectedModel);
    return model?.inputModalities.includes("image") ?? false;
  }, [chatModels, selectedModel]);

  // Drop attachments when switching to a model that can't accept images.
  useEffect(() => {
    if (!supportsImages && attachments.length > 0) {
      setAttachments([]);
      setAttachError(null);
    }
  }, [supportsImages, attachments.length]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachError(null);
    setAttaching(true);
    try {
      const encoded = await Promise.all(
        Array.from(files).map((file) => fileToInlineImage(file)),
      );
      setAttachments((prev) => [...prev, ...encoded].slice(0, 4));
    } catch (err) {
      setAttachError(
        err instanceof Error ? err.message : "Could not attach image.",
      );
    } finally {
      setAttaching(false);
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    if (!pinnedToBottomRef.current) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const rateMultiplier = config?.chatRateMultiplier ?? 1;
  const discountPct = Math.round((1 - rateMultiplier) * 100);
  const minTopUp = config?.chatMinTopUpUsd ?? 1;
  const balanceUsd = balance?.balanceUsd ?? 0;
  const canChat = hasSession && balanceUsd > 0 && Boolean(selectedModel);

  const send = async () => {
    const text = input.trim();
    const images = attachments;
    if ((!text && images.length === 0) || !selectedModel || sending) return;
    if (!hasSession) {
      await syncSession();
      return;
    }

    const userMessage: UiMessage = {
      id: newId(),
      role: "user",
      content: text,
      images: images.length > 0 ? images : undefined,
    };
    const assistantId = newId();

    const history: ChatMessage[] = [...messages, userMessage].map((m) => ({
      role: m.role,
      content:
        m.role === "user"
          ? buildMessageContent(m.content, m.images ?? [])
          : m.content,
    }));

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setAttachments([]);
    setAttachError(null);
    setSending(true);
    // A fresh send should always jump the view back to the latest message.
    pinnedToBottomRef.current = true;

    try {
      await streamChat(selectedModel, history, {
        onToken: (delta) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + delta } : m,
            ),
          );
        },
        onUsage: (usage) => {
          applyBalanceMicro(usage.balanceUsdMicro);
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: message, error: true }
            : m,
        ),
      );
    } finally {
      setSending(false);
      void refresh();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-69px)] w-full max-w-4xl flex-col px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 py-4">
        <div className="min-w-[220px] flex-1">
          <p className="pixel-sans mb-1 text-xs text-black/45">Model</p>
          <ModelPicker
            models={chatModels}
            selectedId={selectedModel}
            onSelect={setSelectedModel}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 text-right">
            <p className="pixel-sans text-[11px] text-black/45">Credits</p>
            <p className="pixel-mono text-sm text-black">
              {formatUsd(balanceUsd)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTopUpOpen(true)}
            className="pixel-sans rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Add credits
          </button>
        </div>
      </div>

      {discountPct > 0 && (
        <p className="pixel-sans py-2 text-center text-xs text-emerald-700">
          You spend ~{discountPct}% less than market rates by paying through
          Auton with $AUTO or USDG.
        </p>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-4 overflow-y-auto py-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h1 className="pixel-serif text-2xl text-black">
              Chat with any model
            </h1>
            <p className="pixel-sans mt-2 max-w-md text-sm text-black/50">
              Top up once with $AUTO or USDG, then spend a single credit balance
              across every model — at a discount to market rates.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      <div className="border-t border-black/10 py-3">
        {!authenticated ? (
          <p className="pixel-sans py-2 text-center text-sm text-black/50">
            Connect your wallet to start chatting.
          </p>
        ) : !hasSession ? (
          <button
            type="button"
            onClick={() => void syncSession()}
            disabled={syncing}
            className="pixel-sans w-full rounded-xl border border-black/15 py-2.5 text-sm text-black/70 hover:border-black/30 disabled:opacity-50"
          >
            {syncing ? "Signing in…" : "Sign in to chat"}
          </button>
        ) : (
          <form onSubmit={onSubmit} className="space-y-2">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((src, index) => (
                  <div key={index} className="relative">
                    <img
                      src={src}
                      alt="attachment preview"
                      className="h-16 w-16 rounded-lg border border-black/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white"
                      aria-label="Remove attachment"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {attachError && (
              <p className="pixel-sans text-xs text-red-600">{attachError}</p>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTR}
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {supportsImages && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attaching || attachments.length >= 4}
                  title="Attach image"
                  className="pixel-sans rounded-xl border border-black/15 px-3 py-2.5 text-sm text-black/60 hover:border-black/30 hover:text-black disabled:opacity-50"
                >
                  {attaching ? "…" : "+ Image"}
                </button>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder={
                  balanceUsd > 0
                    ? "Send a message…"
                    : "Add credits to start chatting…"
                }
                className="pixel-sans max-h-40 flex-1 resize-none rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black/40"
              />
              <button
                type="submit"
                disabled={
                  !canChat ||
                  sending ||
                  (!input.trim() && attachments.length === 0)
                }
                className="pixel-sans rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
          </form>
        )}
        {hasSession && balanceUsd <= 0 && (
          <p className="pixel-sans mt-2 text-center text-xs text-black/40">
            No credits yet — add $AUTO or USDG credits to begin.
          </p>
        )}
      </div>

      <TopUpModal
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onConfirm={async (usd, asset) => {
          const result = await topUp(usd, asset);
          setTopUpSuccess(formatUsd(result.creditedUsd));
        }}
        minUsd={minTopUp}
        busy={toppingUp}
      />

      <SuccessOverlay
        open={topUpSuccess !== null}
        title="Credits added"
        message={
          topUpSuccess ? `${topUpSuccess} added to your balance.` : null
        }
        onDone={() => setTopUpSuccess(null)}
      />
    </div>
  );
}
