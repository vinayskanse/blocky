// @generated automatically by Diesel CLI.

diesel::table! {
    domains (id) {
        id -> Nullable<Integer>,
        group_id -> Text,
        domain -> Text,
    }
}

diesel::table! {
    groups (id) {
        id -> Nullable<Text>,
        name -> Text,
        enabled -> Bool,
    }
}

diesel::table! {
    last_state (id) {
        id -> Nullable<Integer>,
        last_domains -> Text,
        last_update -> Nullable<Timestamp>,
    }
}

diesel::table! {
    schedules (id) {
        id -> Nullable<Integer>,
        group_id -> Text,
        days -> Text,
        start -> Text,
        end -> Text,
    }
}

diesel::joinable!(domains -> groups (group_id));
diesel::joinable!(schedules -> groups (group_id));

diesel::allow_tables_to_appear_in_same_query!(domains, groups, last_state, schedules,);
