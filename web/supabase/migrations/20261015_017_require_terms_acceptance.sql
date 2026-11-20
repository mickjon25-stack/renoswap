-- Server-side enforcement of the signup checkbox ("I'm 18 or older and agree
-- to the Terms and Privacy Policy"). Public email/password signups must carry
-- terms_accepted=true in user metadata, or Supabase Auth rejects the signup.
-- Also records accepted version + time on the profile.

alter table public.profiles
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz;

create or replace function public.enforce_terms_acceptance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin-created users (support, test scripts) must also pass
  -- user_metadata.terms_accepted = true.
  if coalesce(new.raw_user_meta_data ->> 'terms_accepted', 'false') <> 'true' then
    raise exception 'You must be 18 or older and agree to the Terms and Privacy Policy to create an account.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_terms_acceptance on auth.users;
create trigger enforce_terms_acceptance
  before insert on auth.users
  for each row execute function public.enforce_terms_acceptance();

create or replace function public.record_terms_acceptance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data ->> 'terms_accepted' = 'true' then
    update public.profiles
       set terms_version = coalesce(new.raw_user_meta_data ->> 'terms_version', terms_version),
           terms_accepted_at = coalesce((new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz, now())
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists zz_record_terms_acceptance on auth.users;
create trigger zz_record_terms_acceptance
  after insert on auth.users
  for each row execute function public.record_terms_acceptance();
