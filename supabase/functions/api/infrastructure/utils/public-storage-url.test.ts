import { assertEquals } from "@std/assert";
import { resetConfigCache } from "@config";
import { setupTestEnv, TEST_STORAGE_CONFIG } from "@test/env";
import { PublicStorageUrl } from "./public-storage-url.ts";

setupTestEnv();
resetConfigCache();

// --- PublicStorageUrl.bucket() -----------------------------------------------

Deno.test("PublicStorageUrl.bucket - 환경변수에 정의된 버킷으로 URL 생성", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_ASSETS")
    .path("images/photo.jpg")
    .build();

  assertEquals(
    url,
    `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.STORAGE_BUCKET_ASSETS}/images/photo.jpg`,
  );
});

Deno.test("PublicStorageUrl.bucket - public-resources 버킷으로 URL 생성", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_PUBLIC_RESOURCES")
    .path("categories/image.svg")
    .build();

  assertEquals(
    url,
    `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.STORAGE_BUCKET_PUBLIC_RESOURCES}/categories/image.svg`,
  );
});

// --- path() ------------------------------------------------------------------

Deno.test("PublicStorageUrl.path - 전체 경로 설정", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_PROJECTS")
    .path("dir/subdir/file.png")
    .build();

  assertEquals(url.includes("dir/subdir/file.png"), true);
});

Deno.test("PublicStorageUrl.path - null 경로: buildOrNull이 null 반환", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_PROJECTS")
    .path(null)
    .buildOrNull();

  assertEquals(url, null);
});

Deno.test("PublicStorageUrl.path - 연속 호출 시 이전 segments 초기화", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_PROJECTS")
    .path("first/path")
    .path("second/path")
    .build();

  assertEquals(url.includes("first/path"), false);
  assertEquals(url.includes("second/path"), true);
});

// --- directory() + file() ---------------------------------------------------

Deno.test("PublicStorageUrl.directory+file - 디렉토리와 파일명 분리 조합", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_ASSETS")
    .directory("categories")
    .file("image.svg")
    .build();

  assertEquals(url.includes("categories/image.svg"), true);
});

Deno.test("PublicStorageUrl.directory+file - 여러 디렉토리 체이닝", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_ASSETS")
    .directory("level1")
    .directory("level2")
    .directory("level3")
    .file("file.png")
    .build();

  assertEquals(url.includes("level1/level2/level3/file.png"), true);
});

Deno.test("PublicStorageUrl.directory+file - null 디렉토리는 무시됨", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_ASSETS")
    .directory("valid")
    .directory(null)
    .file("file.png")
    .build();

  assertEquals(url.includes("valid/file.png"), true);
  assertEquals(url.includes("null"), false);
});

Deno.test("PublicStorageUrl.directory+file - null 파일명은 무시됨", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_ASSETS")
    .directory("dir")
    .file(null)
    .buildOrNull();

  assertEquals(url?.includes("/dir"), true);
});

// --- build() -----------------------------------------------------------------

Deno.test("PublicStorageUrl.build - 항상 string 반환", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_PROJECTS")
    .path("file.png")
    .build();

  assertEquals(typeof url, "string");
});

Deno.test("PublicStorageUrl.build - segments 비어있어도 URL 생성됨", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_PROJECTS").build();

  assertEquals(
    url.includes(
      `/storage/v1/object/public/${TEST_STORAGE_CONFIG.STORAGE_BUCKET_PROJECTS}/`,
    ),
    true,
  );
});

// --- buildOrNull() -----------------------------------------------------------

Deno.test("PublicStorageUrl.buildOrNull - 유효한 경로: string 반환", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_ASSETS")
    .path("file.png")
    .buildOrNull();

  assertEquals(typeof url, "string");
  assertEquals(url?.includes("file.png"), true);
});

Deno.test("PublicStorageUrl.buildOrNull - segments 비어있으면 null 반환", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_ASSETS")
    .path(null)
    .buildOrNull();

  assertEquals(url, null);
});

Deno.test("PublicStorageUrl.buildOrNull - 빈 문자열 segment는 무시됨", () => {
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_ASSETS")
    .directory("")
    .file("file.png")
    .buildOrNull();

  assertEquals(url?.includes("file.png"), true);
});

// --- 실제 사용 시나리오 -------------------------------------------------------

Deno.test("PublicStorageUrl - 카테고리 이미지 URL 생성", () => {
  const fileName = "electronics.svg";
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_PUBLIC_RESOURCES")
    .directory("categories")
    .file(fileName)
    .build();

  assertEquals(
    url,
    `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.STORAGE_BUCKET_PUBLIC_RESOURCES}/categories/electronics.svg`,
  );
});

Deno.test("PublicStorageUrl - nullable 썸네일 경로: null 반환", () => {
  const thumbnailPath: string | null = null;
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_PUBLIC_RESOURCES")
    .path(thumbnailPath)
    .buildOrNull();

  assertEquals(url, null);
});

Deno.test("PublicStorageUrl - 이미지 생성 스타일 썸네일 URL", () => {
  const styleThumbnailPath = "image-generation-styles/styles/studio.png";
  const url = PublicStorageUrl.bucket("STORAGE_BUCKET_PUBLIC_RESOURCES")
    .path(styleThumbnailPath)
    .build();

  assertEquals(
    url,
    `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.STORAGE_BUCKET_PUBLIC_RESOURCES}/image-generation-styles/styles/studio.png`,
  );
});

Deno.test("PublicStorageUrl - 샘플 이미지 배열 URL 변환", () => {
  const samplePaths = [
    "samples/001.png",
    "samples/002.png",
    "samples/003.png",
  ];

  const urls = samplePaths.map((path) =>
    PublicStorageUrl.bucket("STORAGE_BUCKET_PUBLIC_RESOURCES").path(path).build()
  );

  assertEquals(urls.length, 3);
  assertEquals(
    urls[0],
    `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.STORAGE_BUCKET_PUBLIC_RESOURCES}/samples/001.png`,
  );
  assertEquals(
    urls[1],
    `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.STORAGE_BUCKET_PUBLIC_RESOURCES}/samples/002.png`,
  );
  assertEquals(
    urls[2],
    `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.STORAGE_BUCKET_PUBLIC_RESOURCES}/samples/003.png`,
  );
});
