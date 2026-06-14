import { ArrowRight, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/router/route-paths";
import { Container } from "@/components/common/container";
import { PageShell } from "@/components/common/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authApi } from "@/lib/api/admin-api";
import { useAuthStore } from "@/stores/auth-store";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await authApi.login(form);
      const payload = response?.data ?? response ?? {};
      if (!payload?.user || !payload?.tokens?.accessToken) {
        throw new Error('Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.');
      }
      setSession({ user: payload.user, tokens: payload.tokens });
      const nextPath = location.state?.from?.pathname || ROUTE_PATHS.adminDashboard;
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err.message || "Email hoặc mật khẩu chưa đúng.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <Container className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-md rounded-[2rem]">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-secondary text-primary"><LockKeyhole className="size-5" /></div>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Đăng nhập quản trị</h1>
              <p className="mt-2 text-sm text-muted-foreground">Chỉ dành cho chủ shop Midi Cosmetics quản lý sản phẩm và blog.</p>
            </div>
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium text-foreground">Email<input className="h-12 rounded-2xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" name="email" type="email" value={form.email} onChange={updateField} autoComplete="username" required /></label>
              <label className="grid gap-2 text-sm font-medium text-foreground">Mật khẩu<input className="h-12 rounded-2xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" name="password" type="password" value={form.password} onChange={updateField} autoComplete="current-password" minLength={8} required /></label>
              {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
              <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>{loading ? "Đang đăng nhập..." : "Vào trang quản trị"} <ArrowRight /></Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </PageShell>
  );
}
