
-- Prescriptions bucket
insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', false)
on conflict (id) do nothing;

-- Authenticated vets can upload to prescriptions
create policy "Vets can upload prescriptions"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'prescriptions'
  and exists (select 1 from public.vets v where v.user_id = auth.uid())
);

-- Vets can view files they uploaded; owners can view their own pet's prescription files
create policy "Vets and owners can read prescriptions"
on storage.objects for select
to authenticated
using (
  bucket_id = 'prescriptions'
  and (
    exists (select 1 from public.vets v where v.user_id = auth.uid())
    or exists (
      select 1 from public.vet_prescriptions vp
      where vp.document_url like '%' || storage.objects.name || '%'
        and vp.owner_id = auth.uid()
    )
  )
);
