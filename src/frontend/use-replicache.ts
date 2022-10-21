import { useEffect, useState } from "react";
import { MutatorDefs, Replicache, ReplicacheOptions } from "replicache";
import { subscribeToPokes } from "./poke.js";

export interface UseReplicacheOptions<M extends MutatorDefs>
  extends Omit<ReplicacheOptions<M>, "licenseKey" | "name"> {
  name?: string;
}

/**
 * Returns a Replicache instance with the given configuration.
 * If name is undefined, returns null.
 * If any of the values of the options change (by way of JS equals), a new
 * Replicache instance is created and the old one is closed.
 * Thus it is fine to say `useReplicache({name, mutators})`, as long as name
 * and mutators are stable.
 */
export function useReplicache<M extends MutatorDefs>({
  name,
  ...options
}: UseReplicacheOptions<M>) {
  const [rep, setRep] = useState<Replicache<M> | null>(null);

  useEffect(() => {
    if (!name) {
      setRep(null);
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }

    const r = new Replicache({
      // See https://doc.replicache.dev/licensing for how to get a license key.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      licenseKey: process.env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY!,
      pushURL: `/api/replicache/push?spaceID=${name}`,
      pullURL: `/api/replicache/pull?spaceID=${name}`,
      name,
      ...options,
    });

    // Replicache uses an empty "poke" message sent over some pubsub channel
    // to know when to pull changes from the server. There are many ways to
    // implement pokes. This sample uses Supabase's realtime functionality.
    // - https://doc.replicache.dev/deploy
    // - https://doc.replicache.dev/how-it-works#poke-optional
    // - https://github.com/supabase/realtime
    const cancelSubscription = subscribeToPokes(name, async () => r.pull());
    setRep(r);

    return () => {
      cancelSubscription();
      void r.close();
    };
  }, [name, ...Object.values(options)]);

  if (!rep) {
    return null;
  }

  return rep;
}
