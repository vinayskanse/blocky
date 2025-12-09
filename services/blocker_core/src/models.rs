use serde::{Deserialize, Serialize};

#[derive(Queryable, Serialize, Deserialize, Debug)]
pub struct Group {
    pub id: Option<String>,
    pub name: String,
    pub enabled: bool,
}

use crate::schema::{domains, groups, schedules};
use diesel::prelude::*;

#[derive(Insertable)]
#[diesel(table_name = groups)]
pub struct NewGroup<'a> {
    pub id: &'a str,
    pub name: &'a str,
    pub enabled: bool,
}

#[derive(Queryable, Serialize, Deserialize, Debug)]
pub struct Domain {
    pub id: Option<i32>,
    pub group_id: String,
    pub domain: String,
}

#[derive(Insertable)]
#[diesel(table_name = domains)]
pub struct NewDomain<'a> {
    pub group_id: &'a str,
    pub domain: &'a str,
}

#[derive(Queryable, Serialize, Deserialize, Debug)]
pub struct Schedule {
    pub id: Option<i32>,
    pub group_id: String,
    pub days: String,
    pub start: String,
    pub end: String,
}

#[derive(Insertable)]
#[diesel(table_name = schedules)]
pub struct NewSchedule<'a> {
    pub group_id: &'a str,
    pub days: &'a str,
    pub start: &'a str,
    pub end: &'a str,
}
