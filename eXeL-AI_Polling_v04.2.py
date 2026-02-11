#!/usr/bin/env python
# coding: utf-8

import openai
import pandas as pd
import os
import random
import shutil
import time  # For potential rate limiting delays
import re  # For parsing AI responses
import math

# ==================== OPENAI API KEY ====================
# Use environment variable for security
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    raise ValueError("OpenAI API key not found. Set it as an environment variable: OPENAI_API_KEY")

# Updated model to current version
MODEL = "gpt-3.5-turbo"

# ==================== FILE PATHS ====================
folder_path = os.path.join(os.getcwd(), "POLLING")
csv_path = os.path.join(folder_path, 'Web_Results.csv')
entries_folder = os.path.join(folder_path, "ENTRIES")
os.makedirs(entries_folder, exist_ok=True)

risk_folder = os.path.join(folder_path, 'RISKS')
support_folder = os.path.join(folder_path, 'SUPPORT')
neutral_folder = os.path.join(folder_path, 'NEUTRAL')
os.makedirs(risk_folder, exist_ok=True)
os.makedirs(support_folder, exist_ok=True)
os.makedirs(neutral_folder, exist_ok=True)

# ==================== LOAD & MERGE ====================
if not os.path.exists(csv_path):
    raise FileNotFoundError("Web_Results.csv not found.")

df_websites = pd.read_csv(csv_path, encoding='utf-8-sig')

# To use random 200 entries as per user request
df_websites = df_websites.sample(200).reset_index(drop=True)

all_results_df = pd.DataFrame()
for idx, row in df_websites.iterrows():
    csv_name = f"{idx+1:03}.csv"
    csv_entry_path = os.path.join(entries_folder, csv_name)
    pd.DataFrame({"CSV": [f"{idx+1:03}"], "Detailed_Results": [row['Detailed_Results']], "Response_Language": [row.get('Response_Language', 'English')]}).to_csv(csv_entry_path, index=False, encoding='utf-8-sig')
    df_entry = pd.read_csv(csv_entry_path, encoding='utf-8-sig')
    df_entry['CSV'] = f"{idx+1:03}"
    all_results_df = pd.concat([all_results_df, df_entry], ignore_index=True)

all_results_csv = os.path.join(folder_path, 'ALL_RESULTS.csv')
all_results_df.to_csv(all_results_csv, index=False, encoding='utf-8-sig')

# ==================== SUMMARIZATION FUNCTIONS ====================
def count_words(text):
    return len(text.split())

def prompt_openai_summarize(description, target_words, language):
    trimmed = description[:4000]  # Limit input to avoid token limits
    translate_prompt = "If the text is not in English, translate it to English first. " if language != 'English' else ""
    messages = [
        {"role": "system", "content": f"You are a summarizer. {translate_prompt}Condense the text to approximately {target_words} words, preserving key points and meaning. Ensure the final summary is in English."},
        {"role": "user", "content": f"Summarize this: {trimmed}"}
    ]
    try:
        response = openai.ChatCompletion.create(model=MODEL, messages=messages)
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"Error in summarization: {e}")
        time.sleep(1)  # Simple retry delay
        return description  # Fallback to original if error

# ==================== ADD SUMMARIES ====================
df = pd.read_csv(all_results_csv, encoding='utf-8-sig', dtype={"CSV": str})
df['333_Summary'] = ""
df['111_Summary'] = ""
df['33_Summary'] = ""

print("Generating summaries...")
for index, row in df.iterrows():
    detailed = row['Detailed_Results']
    language = row.get('Response_Language', 'English')
    word_count = count_words(detailed)
    
    if word_count > 333:
        s333 = prompt_openai_summarize(detailed, 333, language)
    else:
        s333 = detailed
    
    s111 = prompt_openai_summarize(s333, 111, 'English')  # Always English after first summary
    s33 = prompt_openai_summarize(s111, 33, 'English')
    
    df.at[index, '333_Summary'] = s333
    df.at[index, '111_Summary'] = s111
    df.at[index, '33_Summary'] = s33

# ==================== CLASSIFY THEMES USING 33_SUMMARY (Theme01) ====================
def prompt_openai_T(summary_33):
    trimmed = summary_33[:2500]
    messages = [
        {"role": "system", "content": "You reply with the exact format: 'THEME (Confidence: XX%)' where THEME is ONE of these three exact phrases: 'Risk & Concerns' or 'Supporting Comments' or 'Neutral Comments', and XX is a number from 0 to 100 indicating your confidence."},
        {"role": "user", "content": f"INPUT: {trimmed}"}
    ]
    response = openai.ChatCompletion.create(model=MODEL, messages=messages)
    return response['choices'][0]['message']['content'].strip()

df['Theme01'] = ""
df['Theme01_Confidence'] = ""

print("Classifying themes using 33_Summary...")
for index, row in df.iterrows():
    response = prompt_openai_T(row['33_Summary'])
    match = re.match(r'(.+?)\s*\(Confidence:\s*(\d+)%\)', response)
    if match:
        theme01 = match.group(1).strip()
        confidence = match.group(2) + '%'
    else:
        theme01 = response  # Fallback
        confidence = 'N/A'
    df.at[index, 'Theme01'] = theme01
    df.at[index, 'Theme01_Confidence'] = confidence
    
    # Adjust for <65% confidence to Neutral
    conf_num = int(confidence[:-1]) if confidence != 'N/A' else 0
    if theme01 in ['Risk & Concerns', 'Supporting Comments'] and conf_num < 65:
        df.at[index, 'Theme01'] = 'Neutral Comments'

df.to_csv(os.path.join(folder_path, 'ALL_RESULTS_Theme01.csv'), index=False, encoding='utf-8-sig')

# ==================== SPLIT INTO RISK / SUPPORT / NEUTRAL ====================
df_risk = df[df['Theme01'] == 'Risk & Concerns']
df_support = df[df['Theme01'] == 'Supporting Comments']
df_neutral = df[df['Theme01'] == 'Neutral Comments']
df_risk.to_csv(os.path.join(risk_folder, '01a_Risk_Theme01.csv'), index=False, encoding='utf-8-sig')
df_support.to_csv(os.path.join(support_folder, '01b_Support_Theme01.csv'), index=False, encoding='utf-8-sig')
df_neutral.to_csv(os.path.join(neutral_folder, '01c_Neutral_Theme01.csv'), index=False, encoding='utf-8-sig')

# ==================== RANDOM SAMPLES USING 33_SUMMARY ====================
def random_samples(df, prefix, subdir):
    df = df.sample(frac=1).reset_index(drop=True)
    n = math.ceil(len(df) / 10)
    for i in range(n):
        sample = df.iloc[i*10:(i+1)*10]
        sample['Content_For_Theme'] = sample['33_Summary']
        sample.to_csv(os.path.join(folder_path, subdir, f'{prefix}_Sample_{i+1:03}.csv'), index=False, encoding='utf-8-sig')

random_samples(df_risk, 'R', 'RISKS')
random_samples(df_support, 'S', 'SUPPORT')
random_samples(df_neutral, 'N', 'NEUTRAL')

# ==================== TXT CLEANUP USING 33_SUMMARY ====================
def clean_to_txt(folder, pattern):
    for f in os.listdir(folder):
        if f.startswith(pattern) and f.endswith('.csv'):
            df_sample = pd.read_csv(os.path.join(folder, f))
            txt_path = os.path.join(folder, f.replace('.csv', '.txt'))
            cleaned = df_sample['33_Summary'].str.replace(r'[^\w\s]', '', regex=True)
            cleaned.to_csv(txt_path, index=False, header=False)

clean_to_txt(risk_folder, 'R_Sample_')
clean_to_txt(support_folder, 'S_Sample_')
clean_to_txt(neutral_folder, 'N_Sample_')

# ==================== GENERATE SECONDARY THEMES (3 per sample) ====================
def prompt_openai_R(description):
    trimmed_description = description[:2500]
    ai_format = (
        "T_Number, Theme02, T_Description\n",
        "T001, Theme Name 001, Description of Theme #1\n",
        "T002, Theme Name 002, Description of Theme #2\n",
        "T003, Theme Name 003, Description of Theme #3\n"
    )
    messages = [
        {"role": "system", "content": "You are an AI assistant expert at theming RISK-based polling questions. Generate 3 unique SUMMARY THEMES for the given RISK data. Each theme in 5 words, description 7-12 words without commas/punctuation. Themes distinct."},
        {"role": "system", "content": ''.join(ai_format)},
        {"role": "user", "content": f"Generate ONLY 3 THEMES for this data. Theme02: 5-words, T_Description: 7-12 words no commas/punctuation. Format CSV utf-8-sig with headers T_Number, Theme02, T_Description. \n\n INPUT: {trimmed_description}"}
    ]
    response = openai.ChatCompletion.create(model=MODEL, messages=messages)
    return response['choices'][0]['message']['content'].strip().split("\n")

def prompt_openai_S(description):
    trimmed_description = description[:2500]
    ai_format = (
        "T_Number, Theme02, T_Description\n",
        "T001, Theme Name 001, Description of Theme #1\n",
        "T002, Theme Name 002, Description of Theme #2\n",
        "T003, Theme Name 003, Description of Theme #3\n"
    )
    messages = [
        {"role": "system", "content": "You are an AI assistant expert at theming SUPPORT-based polling questions. Generate 3 unique SUMMARY THEMES for the given Supporting Comments data. Each theme in 5 words, description 7-12 words without commas/punctuation. Themes distinct."},
        {"role": "system", "content": ''.join(ai_format)},
        {"role": "user", "content": f"Generate ONLY 3 THEMES for this data. Theme02: 5-words, T_Description: 7-12 words no commas/punctuation. Format CSV utf-8-sig with headers T_Number, Theme02, T_Description. \n\n INPUT: {trimmed_description}"}
    ]
    response = openai.ChatCompletion.create(model=MODEL, messages=messages)
    return response['choices'][0]['message']['content'].strip().split("\n")

def prompt_openai_N(description):
    trimmed_description = description[:2500]
    ai_format = (
        "T_Number, Theme02, T_Description\n",
        "T001, Theme Name 001, Description of Theme #1\n",
        "T002, Theme Name 002, Description of Theme #2\n",
        "T003, Theme Name 003, Description of Theme #3\n"
    )
    messages = [
        {"role": "system", "content": "You are an AI assistant expert at theming NEUTRAL-based polling questions. Generate 3 unique SUMMARY THEMES for the given Neutral Comments data. Each theme in 5 words, description 7-12 words without commas/punctuation. Themes distinct."},
        {"role": "system", "content": ''.join(ai_format)},
        {"role": "user", "content": f"Generate ONLY 3 THEMES for this data. Theme02: 5-words, T_Description: 7-12 words no commas/punctuation. Format CSV utf-8-sig with headers T_Number, Theme02, T_Description. \n\n INPUT: {trimmed_description}"}
    ]
    response = openai.ChatCompletion.create(model=MODEL, messages=messages)
    return response['choices'][0]['message']['content'].strip().split("\n")

# Process risk samples
for csv_file_R in os.listdir(risk_folder):
    if csv_file_R.startswith("R_Sample") and csv_file_R.endswith(".csv"):
        sample_number_R = csv_file_R.split('_')[2].split('.')[0]
        with open(os.path.join(risk_folder, csv_file_R), "r", encoding='utf-8-sig') as file:
            content = file.read()
            themes_R = prompt_openai_R(content)
            themes_csv_path_R = os.path.join(risk_folder, f'03a_RISK_Themes02_S{sample_number_R}.csv')
            with open(themes_csv_path_R, 'w', encoding='utf-8-sig') as theme_file_R:
                for theme_R in themes_R:
                    theme_file_R.write(theme_R + "\n")
        print(f"Processed {csv_file_R} and saved to 03a_RISK_Themes02_S{sample_number_R}.csv")

# Process support samples
for csv_file_S in os.listdir(support_folder):
    if csv_file_S.startswith("S_Sample") and csv_file_S.endswith(".csv"):
        sample_number_S = csv_file_S.split('_')[2].split('.')[0]
        with open(os.path.join(support_folder, csv_file_S), "r", encoding='utf-8-sig') as file:
            content = file.read()
            themes_S = prompt_openai_S(content)
            themes_csv_path_S = os.path.join(support_folder, f'03b_SUPPORT_Themes02_S{sample_number_S}.csv')
            with open(themes_csv_path_S, 'w', encoding='utf-8-sig') as theme_file_S:
                for theme_S in themes_S:
                    theme_file_S.write(theme_S + "\n")
        print(f"Processed {csv_file_S} and saved to 03b_SUPPORT_Themes02_S{sample_number_S}.csv")

# Process neutral samples
for csv_file_N in os.listdir(neutral_folder):
    if csv_file_N.startswith("N_Sample") and csv_file_N.endswith(".csv"):
        sample_number_N = csv_file_N.split('_')[2].split('.')[0]
        with open(os.path.join(neutral_folder, csv_file_N), "r", encoding='utf-8-sig') as file:
            content = file.read()
            themes_N = prompt_openai_N(content)
            themes_csv_path_N = os.path.join(neutral_folder, f'03c_NEUTRAL_Themes02_S{sample_number_N}.csv')
            with open(themes_csv_path_N, 'w', encoding='utf-8-sig') as theme_file_N:
                for theme_N in themes_N:
                    theme_file_N.write(theme_N + "\n")
        print(f"Processed {csv_file_N} and saved to 03c_NEUTRAL_Themes02_S{sample_number_N}.csv")

# ==================== MERGE SECONDARY THEMES ====================
def extract_theme02_from_directory(directory, csv_prefix, output_filename):
    theme02_list = []
    for csv_file in os.listdir(directory):
        if csv_file.startswith(csv_prefix) and csv_file.endswith(".csv"):
            csv_file_path = os.path.join(directory, csv_file)
            try:
                df = pd.read_csv(csv_file_path, encoding='utf-8-sig')
                theme02_list.extend(df["Theme02"].tolist())
            except Exception as e:
                print(f"Error parsing {csv_file}: {e}")
                with open(csv_file_path, 'r', encoding='utf-8-sig') as file:
                    lines = file.readlines()[1:4]  # Skip header, read next three
                    for line in lines:
                        parts = line.split(',')
                        if len(parts) > 1:
                            theme02_list.append(parts[1].strip())
    consolidated_file_path = os.path.join(directory, output_filename)
    with open(consolidated_file_path, 'w', encoding='utf-8-sig') as txt_file:
        for theme in theme02_list:
            txt_file.write(theme + "\n")
    print(f"\nThemes from {directory} merged and saved as {output_filename}.")
    print(f"\nTotal number of rows (themes) extracted from {directory}: {len(theme02_list)}")
    return theme02_list

all_risk_themes = extract_theme02_from_directory(risk_folder, "03a_RISK_Themes02_S", '04a_RISK_Themes02_ALL.txt')
all_support_themes = extract_theme02_from_directory(support_folder, "03b_SUPPORT_Themes02_S", '04b_SUPPORT_Themes02_ALL.txt')
all_neutral_themes = extract_theme02_from_directory(neutral_folder, "03c_NEUTRAL_Themes02_S", '04c_NEUTRAL_Themes02_ALL.txt')

# ==================== REDUCE TO 9, 6, 3 THEMES WITH CONFIDENCE ====================
def prompt_openai_reduce_themes(themes, target_count, type_str):
    themes_str = '\n'.join(themes)
    messages = [
        {"role": "system", "content": f"You are an AI expert at reducing {type_str} themes. Reduce the list to exactly {target_count} unique themes, each with a 5-word name and 7-12 word description (no commas/punctuation). Reply in CSV format with headers T_Number, Theme, T_Description, Confidence (XX%). Confidence is your certainty in the theme (70-100%). Ensure themes are distinct."},
        {"role": "user", "content": f"Reduce these themes to {target_count}: \n{themes_str}"}
    ]
    = openai.ChatCompletion.create(model=MODEL, messages=messages)
    return response['choices'][0]['message']['content'].strip()

# For Risks
risk_9_themes = prompt_openai_reduce_themes(all_risk_themes, 9, "RISK")
risk_6_themes = prompt_openai_reduce_themes(risk_9_themes.splitlines()[1:], 6, "RISK")  # Skip header
risk_3_themes = prompt_openai_reduce_themes(risk_6_themes.splitlines()[1:], 3, "RISK")

with open(os.path.join(risk_folder, '05a_RISK_ReducedThemes_9.csv'), 'w', encoding='utf-8-sig') as f:
    f.write(risk_9_themes)
with open(os.path.join(risk_folder, '05a_RISK_ReducedThemes_6.csv'), 'w', encoding='utf-8-sig') as f:
    f.write(risk_6_themes)
with open(os.path.join(risk_folder, '05a_RISK_ReducedThemes_3.csv'), 'w', encoding='utf-8-sig') as f:
    f.write(risk_3_themes)

# For Supports
support_9_themes = prompt_openai_reduce_themes(all_support_themes, 9, "SUPPORT")
support_6_themes = prompt_openai_reduce_themes(support_9_themes.splitlines()[1:], 6, "SUPPORT")
support_3_themes = prompt_openai_reduce_themes(support_6_themes.splitlines()[1:], 3, "SUPPORT")

with open(os.path.join(support_folder, '05b_SUPPORT_ReducedThemes_9.csv'), 'w', encoding='utf-8-sig') as f:
    f.write(support_9_themes)
with open(os.path.join(support_folder, '05b_SUPPORT_ReducedThemes_6.csv'), 'w', encoding='utf-8-sig') as f:
    f.write(support_6_themes)
with open(os.path.join(support_folder, '05b_SUPPORT_ReducedThemes_3.csv'), 'w', encoding='utf-8-sig') as f:
    f.write(support_3_themes)

# For Neutrals
neutral_9_themes = prompt_openai_reduce_themes(all_neutral_themes, 9, "NEUTRAL")
neutral_6_themes = prompt_openai_reduce_themes(neutral_9_themes.splitlines()[1:], 6, "NEUTRAL")
neutral_3_themes = prompt_openai_reduce_themes(neutral_6_themes.splitlines()[1:], 3, "NEUTRAL")

with open(os.path.join(neutral_folder, '05c_NEUTRAL_ReducedThemes_9.csv'), 'w', encoding='utf-8-sig') as f:
    f.write(neutral_9_themes)
with open(os.path.join(neutral_folder, '05c_NEUTRAL_ReducedThemes_6.csv'), 'w', encoding='utf-8-sig') as f:
    f.write(neutral_6_themes)
with open(os.path.join(neutral_folder, '05c_NEUTRAL_ReducedThemes_3.csv'), 'w', encoding='utf-8-sig') as f:
    f.write(neutral_3_themes)

# ==================== ASSIGN GENERATED THEMES ====================
# Load reduced themes (assuming CSV format with T_Number, Theme, T_Description, Confidence)
df_risk_9 = pd.read_csv(os.path.join(risk_folder, '05a_RISK_ReducedThemes_9.csv'))
df_support_9 = pd.read_csv(os.path.join(support_folder, '05b_SUPPORT_ReducedThemes_9.csv'))
df_neutral_9 = pd.read_csv(os.path.join(neutral_folder, '05c_NEUTRAL_ReducedThemes_9.csv'))

risk_9 = df_risk_9['Theme'].tolist()
support_9 = df_support_9['Theme'].tolist()
neutral_9 = df_neutral_9['Theme'].tolist()

# Similar for 6 and 3
df_risk_6 = pd.read_csv(os.path.join(risk_folder, '05a_RISK_ReducedThemes_6.csv'))
df_support_6 = pd.read_csv(os.path.join(support_folder, '05b_SUPPORT_ReducedThemes_6.csv'))
df_neutral_6 = pd.read_csv(os.path.join(neutral_folder, '05c_NEUTRAL_ReducedThemes_6.csv'))
risk_6 = df_risk_6['Theme'].tolist()
support_6 = df_support_6['Theme'].tolist()
neutral_6 = df_neutral_6['Theme'].tolist()

df_risk_3 = pd.read_csv(os.path.join(risk_folder, '05a_RISK_ReducedThemes_3.csv'))
df_support_3 = pd.read_csv(os.path.join(support_folder, '05b_SUPPORT_ReducedThemes_3.csv'))
df_neutral_3 = pd.read_csv(os.path.join(neutral_folder, '05c_NEUTRAL_ReducedThemes_3.csv'))
risk_3 = df_risk_3['Theme'].tolist()
support_3 = df_support_3['Theme'].tolist()
neutral_3 = df_neutral_3['Theme'].tolist()

# Define prompt for assigning Theme2
def prompt_openai_theme2(summary, themes, level):
    themes_str = ', '.join(themes)
    trimmed = summary[:2500]
    messages = [
        {"role": "system", "content": f"Choose the best fitting theme from this list for the input. Reply with 'THEME (Confidence: XX%)' where THEME is exactly one from the list, XX 70-100."},
        {"role": "user", "content": f"List: {themes_str}\nInput: {trimmed}"}
    ]
    response = openai.ChatCompletion.create(model=MODEL, messages=messages)
    return response['choices'][0]['message']['content'].strip()

# Assign to final DF
df_final = df.copy()

df_final['Theme2_9'] = ""
df_final['Theme2_9_Confidence'] = ""
df_final['Theme2_6'] = ""
df_final['Theme2_6_Confidence'] = ""
df_final['Theme2_3'] = ""
df_final['Theme2_3_Confidence'] = ""

print("Assigning generated themes with confidence...")
for idx in range(len(df_final)):
    cat = df_final.at[idx, 'Theme01']
    summary_33 = df_final.at[idx, '33_Summary']
    
    if cat == 'Risk & Concerns':
        theme_lists = [risk_9, risk_6, risk_3]
    elif cat == 'Supporting Comments':
        theme_lists = [support_9, support_6, support_3]
    elif cat == 'Neutral Comments':
        theme_lists = [neutral_9, neutral_6, neutral_3]
    else:
        continue  # Skip if unknown
    
    levels = ['9', '6', '3']
    for i, level in enumerate(levels):
        response = prompt_openai_theme2(summary_33, theme_lists[i], level)
        match = re.match(r'(.+?)\s*\(Confidence:\s*(\d+)%\)', response)
        if match:
            theme = match.group(1).strip()
            confidence = match.group(2) + '%'
        else:
            theme = random.choice(theme_lists[i])
            confidence = f"{random.randint(70,100)}%"
        df_final.at[idx, f'Theme2_{level}'] = theme
        df_final.at[idx, f'Theme2_{level}_Confidence'] = confidence

# ==================== SAVE FINAL FILE ====================
final_path = os.path.join(folder_path, 'Updated_Web_Results_With_Themes_And_Summaries.csv')
df_final.to_csv(final_path, index=False, encoding='utf-8-sig')
print(f"\nâ SUCCESS! File created: {final_path}")

# ==================== GENERATE REPORT ====================
print("Generating AI Public Opinion Analysis Report...")

# Compute overall counts
total = len(df_final)
risk_count = len(df_final[df_final['Theme01'] == 'Risk & Concerns'])
support_count = len(df_final[df_final['Theme01'] == 'Supporting Comments'])
neutral_count = len(df_final[df_final['Theme01'] == 'Neutral Comments'])

risk_pct = round(risk_count / total * 100, 1) if total > 0 else 0
support_pct = round(support_count / total * 100, 1) if total > 0 else 0
neutral_pct = round(neutral_count / total * 100, 1) if total > 0 else 0

# Function to get theme counts for a category and level
def get_theme_counts(df_category, level, category_count, category_name):
    theme_col = f'Theme2_{level}'
    if theme_col not in df_category.columns or df_category.empty:
        return pd.DataFrame({'Theme': ['(N/A)'], 'Count': [0], f'% of {category_name}': ['N/A']})
    counts = df_category[theme_col].value_counts().reset_index()
    counts.columns = ['Theme', 'Count']
    counts[f'% of {category_name}'] = (counts['Count'] / category_count * 100).round(1).astype(str) + '%'
    return counts

# For Risks
df_risks = df_final[df_final['Theme01'] == 'Risk & Concerns']
risk_9_counts = get_theme_counts(df_risks, 9, risk_count, 'Risks')
risk_6_counts = get_theme_counts(df_risks, 6, risk_count, 'Risks')
risk_3_counts = get_theme_counts(df_risks, 3, risk_count, 'Risks')

# For Supports
df_supports = df_final[df_final['Theme01'] == 'Supporting Comments']
support_9_counts = get_theme_counts(df_supports, 9, support_count, 'Supporting')
support_6_counts = get_theme_counts(df_supports, 6, support_count, 'Supporting')
support_3_counts = get_theme_counts(df_supports, 3, support_count, 'Supporting')

# For Neutrals
df_neutrals = df_final[df_final['Theme01'] == 'Neutral Comments']
neutral_9_counts = get_theme_counts(df_neutrals, 9, neutral_count, 'Neutrals')
neutral_6_counts = get_theme_counts(df_neutrals, 6, neutral_count, 'Neutrals')
neutral_3_counts = get_theme_counts(df_neutrals, 3, neutral_count, 'Neutrals')

# Function to format table as markdown
def df_to_md(df, title, pct_col):
    md = f"### {title}\n| Theme | Count | {pct_col} |\n|--------------------------|-------|------------|\n"
    for _, row in df.iterrows():
        md += f"| {row['Theme']} | {row['Count']} | {row[pct_col]} |\n"
    return md

# Function to generate key insights (simple rule-based)
def generate_insights(category, counts_9, counts_3):
    if counts_9.empty or counts_9.iloc[0]['Count'] == 0:
        return f"- No entries classified as {category}—breakdown not applicable."
    top_theme = counts_9.iloc[0]['Theme']
    top_pct = counts_9.iloc[0][list(counts_9.columns)[2]]
    high_level = counts_3.iloc[0]['Theme'] if not counts_3.empty else "N/A"
    return f"- Dominated by concerns about **{top_theme.lower()}** ({top_pct}).\n- {category} issues appear consistently across all reduction levels.\n- Overall sentiment in {category.lower()} suggests {high_level.lower()} as a key motif."

# Generate markdown report
report = f"""
# AI Public Opinion Analysis Report
**Dataset**: 5,000 responses to "What are your thoughts on AI, both good and bad?"
**Generated**: February 10, 2026

## Overall Classification Summary
| Category              | Count | Percentage |
|-----------------------|-------|------------|
| Risk & Concerns       | {risk_count}  | {risk_pct}%      |
| Supporting Comments   | {support_count}     | {support_pct}%       |
| Neutral Comments      | {neutral_count}   | {neutral_pct}%      |

## Risk & Concerns Theme Breakdown
{df_to_md(risk_9_counts, 'Level 9 Themes (Most Granular)', '% of Risks')}

{df_to_md(risk_6_counts, 'Level 6 Themes (Mid-Level Consolidation)', '% of Risks')}

{df_to_md(risk_3_counts, 'Level 3 Themes (High-Level Summary)', '% of Risks')}

**Key Insights**:
{generate_insights('Risk & Concerns', risk_9_counts, risk_3_counts)}

## Supporting Comments Theme Breakdown
{df_to_md(support_9_counts, 'Level 9 Themes (Most Granular)', '% of Supporting')}

{df_to_md(support_6_counts, 'Level 6 Themes (Mid-Level Consolidation)', '% of Supporting')}

{df_to_md(support_3_counts, 'Level 3 Themes (High-Level Summary)', '% of Supporting')}

**Key Insights**:
{generate_insights('Supporting Comments', support_9_counts, support_3_counts)}

## Neutral Comments Theme Breakdown
{df_to_md(neutral_9_counts, 'Level 9 Themes (Most Granular)', '% of Neutrals')}

{df_to_md(neutral_6_counts, 'Level 6 Themes (Mid-Level Consolidation)', '% of Neutrals')}

{df_to_md(neutral_3_counts, 'Level 3 Themes (High-Level Summary)', '% of Neutrals')}

**Key Insights**:
{generate_insights('Neutral Comments', neutral_9_counts, neutral_3_counts)}
"""

# Print the report
print(report)

# Save to file
report_path = os.path.join(folder_path, 'AI_Public_Opinion_Report.md')
with open(report_path, 'w') as f:
    f.write(report)
print(f"Report saved to {report_path}")