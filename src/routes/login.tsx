import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { SignInGate, UserButton } from "@/lib/auth/gates";
import { Page } from "@/components/shell";
import { useTx } from "@/lib/i18n";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { tx } = useTx();
  return (
    <Page>
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">
          {tx("Doanh nghiệp đã có tài khoản", "Enterprise with an account")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-navy">{tx("Đăng nhập", "Sign in")}</h1>
        <p className="mt-3 text-sm text-muted">
          {tx(
            "Lần đầu dùng dịch vụ thì đăng ký dùng thử. Tài khoản đã mở thì vào đây, không đăng ký lại.",
            "A first visit uses the trial request. An account that is already open signs in here and does not register again.",
          )}
        </p>
        <div className="mt-6 rounded-lg border border-line bg-card p-5">
          {authEnabled ? (
            <SignInGate
              fallback={
                <div className="space-y-3">
                  {GROK_PROVIDERS.map((provider) => (
                    <button
                      key={provider.providerId}
                      type="button"
                      onClick={() => signIn(provider.providerId, { callbackURL: "/cong-thong-tin" })}
                      className="flex h-11 w-full items-center justify-center rounded-md border border-line bg-paper text-sm font-semibold text-navy"
                    >
                      {tx(`Tiếp tục với ${provider.label}`, `Continue with ${provider.label}`)}
                    </button>
                  ))}
                </div>
              }
            >
              <p className="text-sm text-ink">
                {tx(
                  "Tài khoản đã mở. Vào cổng để tạo đơn, theo dõi và thanh toán cước.",
                  "The account is open. Enter the portal to create an order, track it, and pay the fee.",
                )}
              </p>
              <UserButton />
              <Link
                to="/cong-thong-tin"
                className="mt-4 inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-semibold text-paper"
              >
                {tx("Vào cổng khách hàng", "Enter the customer portal")}
              </Link>
            </SignInGate>
          ) : (
            <p className="text-sm text-muted">{tx("Đăng nhập chưa được bật.", "Sign-in is not enabled.")}</p>
          )}
        </div>
        <Link to="/dang-ky" className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-teal">
          {tx("Chưa có tài khoản? Đăng ký dùng thử", "No account yet? Request a trial")}
        </Link>
      </div>
    </Page>
  );
}
