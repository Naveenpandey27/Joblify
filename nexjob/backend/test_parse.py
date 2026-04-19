import pdfplumber
import sys

def main():
    with pdfplumber.open("test_resume.pdf") as pdf:
        text = pdf.pages[0].extract_text(layout=True)
        print(text[:2000])

if __name__ == "__main__":
    main()
