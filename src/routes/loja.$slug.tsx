import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  MessageCircle,
  Scissors,
  Store,
  X,
} from "lucide-react";
import { money } from "@/components/localhub/ui";
import { useLocalHub, type Service } from "@/lib/localhub-context";

export const Route = createFileRoute("/loja/$slug")({ component: PublicBusinessPage });

function PublicBusinessPage() {
  const { slug } = Route.useParams();
  const { getPublicStore, addBooking } = useLocalHub();
  const [store, setStore] = useState<Awaited<ReturnType<typeof getPublicStore>>>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [selected, setSelected] = useState<Service | null>(null);
  const [complete, setComplete] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    void getPublicStore(slug)
      .then((result) => {
        if (active) setStore(result);
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(error instanceof Error ? error.message : "Falha ao carregar a página.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getPublicStore, slug]);
  const business = store?.business ?? null;
  const services = store?.services ?? [];
  const activeServices = services.filter((service) => service.active);

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !business) return;
    setBookingBusy(true);
    setBookingError("");
    try {
      await addBooking(business.id!, {
        serviceId: selected.id,
        date,
        time,
        customerName: customerName.trim(),
        phone,
      });
      setComplete(true);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Não foi possível enviar o pedido.");
    } finally {
      setBookingBusy(false);
    }
  }

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#faf8ff] text-sm font-semibold text-indigo-700">
        Carregando página...
      </div>
    );
  if (loadError || !business || business.slug !== slug)
    return (
      <div className="grid min-h-screen place-items-center bg-[#faf8ff] px-5 text-center">
        <div>
          <Store className="mx-auto text-indigo-500" size={30} />
          <h1 className="mt-4 text-2xl font-bold">Página não encontrada</h1>
          <p className="mt-2 text-sm text-slate-500">
            {loadError || "Confira o link ou crie sua página LocalHub."}
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white"
          >
            Ir para LocalHub
          </Link>
        </div>
      </div>
    );

  const waNumber = business.phone.replace(/\D/g, "");
  const whatsappUrl = waNumber
    ? "https://wa.me/" +
      waNumber +
      "?text=" +
      encodeURIComponent("Olá! Encontrei sua página " + business.name + " no LocalHub.")
    : undefined;
  return (
    <div className="min-h-screen bg-[#f7f7fb] pb-12 text-[#172033]">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-extrabold">
            <span className="grid size-8 place-items-center rounded-xl bg-indigo-600 text-white">
              <Store size={16} />
            </span>
            LocalHub
          </Link>
          <div className="flex gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="relative mt-5 overflow-hidden rounded-[28px] bg-[#24205f] px-6 py-9 text-white sm:mt-8 sm:px-10 sm:py-12">
          <div className="absolute -right-8 -top-20 size-64 rounded-full bg-indigo-400/30 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-indigo-100">
              {business.category}
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              {business.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80">
              {business.description || "Conheça nossos serviços e agende seu próximo horário."}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-indigo-100/80">
              {business.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {business.address ? business.address + " · " : ""}
                  {business.city}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                Agendamento online
              </span>
            </div>
          </div>
        </section>
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[.14em] text-indigo-600">
                Escolha o que combina com você
              </div>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">Serviços</h2>
            </div>
            <span className="text-xs text-slate-400">{activeServices.length} opções</span>
          </div>
          {activeServices.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {activeServices.map((service) => (
                <article
                  key={service.id}
                  className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Scissors size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{service.name}</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {service.description || "Atendimento feito com cuidado para você."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <div className="text-lg font-extrabold text-[#302ab0]">
                        {money(service.price)}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock3 size={12} />
                        {service.duration} minutos
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelected(service);
                        setComplete(false);
                      }}
                      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                    >
                      Agendar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Scissors className="mx-auto text-indigo-300" size={26} />
              <p className="mt-3 text-sm font-semibold">Estamos preparando nosso catálogo</p>
              <p className="mt-1 text-xs text-slate-400">
                Entre em contato pelo WhatsApp para conhecer nossos serviços.
              </p>
            </div>
          )}
        </section>
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-400">
          <span>
            {business.name} · {business.city}
          </span>
          <span>
            Feito com{" "}
            <a href="/" className="font-bold text-indigo-600">
              LocalHub
            </a>
          </span>
        </footer>
      </main>

      {selected && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
              setComplete(false);
            }
          }}
          className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-4"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            className="w-full max-w-lg rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[.14em] text-indigo-600">
                  {complete ? "Pedido recebido" : "Agendamento"}
                </div>
                <h2 id="booking-title" className="mt-1 text-xl font-extrabold">
                  {complete ? "Pronto, " + customerName + "!" : selected.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {complete
                    ? "A loja recebeu seu pedido e vai confirmar o horário."
                    : money(selected.price) + " · " + selected.duration + " min"}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  setComplete(false);
                }}
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={17} />
              </button>
            </div>
            {complete ? (
              <div className="rounded-2xl bg-emerald-50 px-5 py-7 text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={22} />
                </span>
                <p className="mt-3 text-sm font-bold text-emerald-900">
                  Pedido para{" "}
                  {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  às {time}
                </p>
                <p className="mt-1 text-xs text-emerald-800/70">
                  Você pode acompanhar a confirmação pelo telefone informado.
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="mt-5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={(event) => void book(event)} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">Seu nome</span>
                  <input
                    required
                    autoFocus
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Como podemos te chamar?"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    WhatsApp para confirmação
                  </span>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    placeholder="(11) 99999-9999"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">Data</span>
                    <input
                      required
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-400"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">Horário</span>
                    <select
                      required
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-400"
                    >
                      <option value="">Escolha</option>
                      {[
                        "09:00",
                        "10:00",
                        "11:00",
                        "13:00",
                        "14:00",
                        "15:00",
                        "16:00",
                        "17:00",
                        "18:00",
                      ].map((slot) => (
                        <option key={slot}>{slot}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {bookingError && (
                  <p role="alert" className="text-sm text-red-600">
                    {bookingError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={bookingBusy}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {bookingBusy ? "Enviando..." : "Pedir agendamento"}
                </button>
                <p className="text-center text-[10px] leading-4 text-slate-400">
                  Seu pedido fica pendente até a loja confirmar.
                </p>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
