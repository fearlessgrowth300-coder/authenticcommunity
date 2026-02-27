import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-OYm_3-0RQmQ_3AJXI2LpFgz4XuGtJ6bEZpHEk";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const storageKey = user ? `push_subscribed_${user.id}` : "push_subscribed_guest";

  const syncSubscription = useCallback(async () => {
    if (!isSupported || !user) {
      setIsSubscribed(false);
      return;
    }

    try {
      setPermission(Notification.permission);
      const reg: any = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager?.getSubscription();

      if (sub) {
        const json = sub.toJSON();
        await supabase.from("push_subscriptions").upsert({
          user_id: user.id,
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        }, { onConflict: "user_id,endpoint" });
        setIsSubscribed(true);
        localStorage.setItem(storageKey, "true");
        return;
      }

      const remembered = localStorage.getItem(storageKey) === "true";
      setIsSubscribed(remembered && Notification.permission === "granted");
    } catch {
      const remembered = localStorage.getItem(storageKey) === "true";
      setIsSubscribed(remembered && Notification.permission === "granted");
    }
  }, [isSupported, user, storageKey]);

  useEffect(() => {
    setIsSupported("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    syncSubscription();
  }, [syncSubscription]);

  useEffect(() => {
    const refresh = () => syncSubscription();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [syncSubscription]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return false;

    try {
      const currentPermission = Notification.permission;
      if (currentPermission === "denied") {
        setPermission("denied");
        return false;
      }

      const perm = currentPermission === "granted" ? "granted" : await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg: any = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const json = sub.toJSON();
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      }, { onConflict: "user_id,endpoint" });

      localStorage.setItem(storageKey, "true");
      setIsSubscribed(true);
      return true;
    } catch {
      return false;
    }
  }, [isSupported, user, storageKey]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user) return;

    try {
      const reg: any = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager?.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
      } else {
        await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
      }
      localStorage.removeItem(storageKey);
      setIsSubscribed(false);
    } catch {}
  }, [isSupported, user, storageKey]);

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe, refresh: syncSubscription };
}

