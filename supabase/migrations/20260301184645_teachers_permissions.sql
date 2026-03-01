create policy "teachers: authenticated users can read"
    on private.teachers for select
    to authenticated
    using (true);

grant select on private.teachers to authenticated;
