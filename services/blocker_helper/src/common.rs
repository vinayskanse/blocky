pub const START_MARKER: &str = "# >>> SITE_BLOCKER_START";
pub const END_MARKER: &str = "# <<< SITE_BLOCKER_END";

/// Remove everything between START_MARKER and END_MARKER (inclusive).
pub fn remove_our_block(content: &str) -> String {
    let start_idx = content.find(START_MARKER);
    let end_idx = content.find(END_MARKER);

    match (start_idx, end_idx) {
        (Some(s), Some(e)) if e >= s => {
            // include the END_MARKER line and the newline after it if present
            let after_end = content[e + END_MARKER.len()..]
                .find('\n')
                .map(|offset| e + END_MARKER.len() + offset + 1)
                .unwrap_or(content.len());

            let before = &content[..s];
            let after = &content[after_end..];

            let mut merged = String::new();
            merged.push_str(before.trim_end());
            merged.push('\n');
            merged.push_str(after.trim_start_matches('\n'));
            merged
        }
        _ => content.to_string(),
    }
}
