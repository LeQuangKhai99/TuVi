"""
scripts/lookup-dataset.py
Quản lý và tra cứu bộ dữ liệu 674,976 lá số (1950–2026) từ v4.0 dataset của Nghê Hải Hạ.
Tải theo nhu cầu (on-demand ~2MB/năm) và stream giải nén trực tiếp trong bộ nhớ.
"""

import sys
import os
import json
import argparse
import urllib.request
import ssl
import io

BASE_RELEASE_URL = "https://github.com/Renhuai123/ziwei-doushu/releases/download/v4.0-13d"
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "dataset")

def get_ssl_context():
    try:
        return ssl.create_default_context()
    except Exception:
        return ssl._create_unverified_context()

def ensure_cache_dir():
    os.makedirs(CACHE_DIR, exist_ok=True)

def get_year_file_path(year: int) -> str:
    return os.path.join(CACHE_DIR, f"year-{year}.jsonl.zst")

def download_year_file(year: int) -> str:
    ensure_cache_dir()
    filepath = get_year_file_path(year)
    if os.path.exists(filepath) and os.path.getsize(filepath) > 100000:
        return filepath

    url = f"{BASE_RELEASE_URL}/year-{year}.jsonl.zst"
    sys.stderr.write(f"Downloading dataset for year {year} (~2MB)...\n")
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, context=ctx, timeout=60) as resp, open(filepath + ".tmp", "wb") as f:
        while True:
            chunk = resp.read(65536)
            if not chunk:
                break
            f.write(chunk)
    os.replace(filepath + ".tmp", filepath)
    sys.stderr.write(f"Saved {filepath} ({os.path.getsize(filepath)} bytes)\n")
    return filepath

def lookup_chart(year: int, month: int, day: int, hour: int, gender: str):
    import zstandard
    filepath = download_year_file(year)
    target_key = f"{year}-{month:02d}-{day:02d}-{hour}-{gender}"

    dctx = zstandard.ZstdDecompressor(max_window_size=2**28)
    with open(filepath, "rb") as fh:
        with dctx.stream_reader(fh) as reader:
            text_stream = io.TextIOWrapper(reader, encoding="utf-8")
            for line in text_stream:
                if target_key in line:
                    obj = json.loads(line)
                    if obj.get("k") == target_key:
                        return obj
    return None

def main():
    parser = argparse.ArgumentParser(description="Ziwei Dataset v4.0 Lookup & Manager")
    parser.add_argument("--year", type=int, help="Year (1950-2026)")
    parser.add_argument("--month", type=int, help="Month (1-12)")
    parser.add_argument("--day", type=int, help="Day (1-31)")
    parser.add_argument("--hour", type=int, help="Hour index (0-11)")
    parser.add_argument("--gender", type=str, choices=["male", "female"], help="Gender")
    parser.add_argument("--topic", type=str, help="Specific topic key")
    parser.add_argument("--translate", action="store_true", help="Translate content verbatim to Vietnamese")
    parser.add_argument("--download-all", action="store_true", help="Download all years 1950-2026")
    parser.add_argument("--download-year", type=int, help="Download a specific year")

    args = parser.parse_args()

    if args.download_all:
        ensure_cache_dir()
        for y in range(1950, 2027):
            try:
                download_year_file(y)
            except Exception as e:
                sys.stderr.write(f"Failed year {y}: {e}\n")
        print("Completed downloading all years.")
        return

    if args.download_year:
        download_year_file(args.download_year)
        print(f"Downloaded year {args.download_year}.")
        return

    if not all([args.year, args.month, args.day, args.hour is not None, args.gender]):
        parser.print_help()
        sys.exit(1)

    try:
        chart_data = lookup_chart(args.year, args.month, args.day, args.hour, args.gender)
        if not chart_data:
            sys.stderr.write(f"Chart not found for key: {args.year}-{args.month:02d}-{args.day:02d}-{args.hour}-{args.gender}\n")
            sys.exit(2)

        if args.topic:
            topic_content = chart_data.get("c", {}).get(args.topic, "")
            if args.translate and topic_content:
                from translate_helper import get_cached_translation
                topic_content = get_cached_translation(chart_data.get("k", ""), args.topic, topic_content)
            print(json.dumps({"topic": args.topic, "content": topic_content}, ensure_ascii=False))
        else:
            if args.translate:
                from translate_helper import get_cached_translation
                k = chart_data.get("k", "")
                for t_key, t_val in chart_data.get("c", {}).items():
                    chart_data["c"][t_key] = get_cached_translation(k, t_key, t_val)
            print(json.dumps(chart_data, ensure_ascii=False))
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(3)

if __name__ == "__main__":
    main()
