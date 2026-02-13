import { assertEquals } from "@std/assert";
import { beforeAll, describe, it } from "@std/testing/bdd";
import { resetConfigCache } from "@app/config";
import { setupTestEnv, TEST_STORAGE_CONFIG } from "@test/setup";
import { PublicStorageUrl } from "./public-storage-url.ts";

beforeAll(() => {
  setupTestEnv();
  resetConfigCache(); // 환경변수 변경 후 캐시 초기화
});

// =============================================================================
// PublicStorageUrl.bucket()
// =============================================================================

describe("PublicStorageUrl.bucket()", () => {
  it("환경변수에 정의된 버킷으로 URL 생성", () => {
    const url = PublicStorageUrl.bucket("ASSETS_BUCKET")
      .path("images/photo.jpg")
      .build();

    assertEquals(
      url,
      `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.ASSETS_BUCKET}/images/photo.jpg`,
    );
  });
});

// =============================================================================
// PUBLIC_RESOURCES_BUCKET
// =============================================================================

describe("PUBLIC_RESOURCES_BUCKET", () => {
  it("public-resources 버킷으로 URL 생성", () => {
    const url = PublicStorageUrl.bucket("PUBLIC_RESOURCES_BUCKET")
      .path("categories/image.svg")
      .build();

    assertEquals(
      url,
      `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.PUBLIC_RESOURCES_BUCKET}/categories/image.svg`,
    );
  });
});

// =============================================================================
// path()
// =============================================================================

describe("path()", () => {
  it("전체 경로 설정", () => {
    const url = PublicStorageUrl.bucket("PROJECTS_BUCKET")
      .path("dir/subdir/file.png")
      .build();

    assertEquals(url.includes("dir/subdir/file.png"), true);
  });

  it("null 경로 설정 시 segments 비어있음", () => {
    const url = PublicStorageUrl.bucket("PROJECTS_BUCKET")
      .path(null)
      .buildOrNull();

    assertEquals(url, null);
  });

  it("연속 호출 시 이전 segments 초기화", () => {
    const url = PublicStorageUrl.bucket("PROJECTS_BUCKET")
      .path("first/path")
      .path("second/path")
      .build();

    assertEquals(url.includes("first/path"), false);
    assertEquals(url.includes("second/path"), true);
  });
});

// =============================================================================
// directory() + file()
// =============================================================================

describe("directory() + file()", () => {
  it("디렉토리와 파일명 분리 조합", () => {
    const url = PublicStorageUrl.bucket("ASSETS_BUCKET")
      .directory("categories")
      .file("image.svg")
      .build();

    assertEquals(url.includes("categories/image.svg"), true);
  });

  it("여러 디렉토리 체이닝", () => {
    const url = PublicStorageUrl.bucket("ASSETS_BUCKET")
      .directory("level1")
      .directory("level2")
      .directory("level3")
      .file("file.png")
      .build();

    assertEquals(url.includes("level1/level2/level3/file.png"), true);
  });

  it("null 디렉토리는 무시됨", () => {
    const url = PublicStorageUrl.bucket("ASSETS_BUCKET")
      .directory("valid")
      .directory(null)
      .file("file.png")
      .build();

    assertEquals(url.includes("valid/file.png"), true);
    assertEquals(url.includes("null"), false);
  });

  it("null 파일명은 무시됨", () => {
    const url = PublicStorageUrl.bucket("ASSETS_BUCKET")
      .directory("dir")
      .file(null)
      .buildOrNull();

    assertEquals(url?.includes("/dir"), true);
  });
});

// =============================================================================
// build()
// =============================================================================

describe("build()", () => {
  it("항상 string 반환", () => {
    const url = PublicStorageUrl.bucket("PROJECTS_BUCKET")
      .path("file.png")
      .build();

    assertEquals(typeof url, "string");
  });

  it("segments 비어있어도 URL 생성됨", () => {
    const url = PublicStorageUrl.bucket("PROJECTS_BUCKET").build();

    assertEquals(
      url.includes(
        `/storage/v1/object/public/${TEST_STORAGE_CONFIG.PROJECTS_BUCKET}/`,
      ),
      true,
    );
  });
});

// =============================================================================
// buildOrNull()
// =============================================================================

describe("buildOrNull()", () => {
  it("유효한 경로면 string 반환", () => {
    const url = PublicStorageUrl.bucket("ASSETS_BUCKET")
      .path("file.png")
      .buildOrNull();

    assertEquals(typeof url, "string");
    assertEquals(url?.includes("file.png"), true);
  });

  it("segments 비어있으면 null 반환", () => {
    const url = PublicStorageUrl.bucket("ASSETS_BUCKET")
      .path(null)
      .buildOrNull();

    assertEquals(url, null);
  });

  it("빈 문자열 segment가 있으면 유효 (falsy라 추가 안됨)", () => {
    const url = PublicStorageUrl.bucket("ASSETS_BUCKET")
      .directory("")
      .file("file.png")
      .buildOrNull();

    assertEquals(url?.includes("file.png"), true);
  });
});

// =============================================================================
// 실제 사용 시나리오
// =============================================================================

describe("실제 사용 시나리오", () => {
  it("카테고리 이미지 URL 생성", () => {
    const fileName = "electronics.svg";
    const url = PublicStorageUrl.bucket("PUBLIC_RESOURCES_BUCKET")
      .directory("categories")
      .file(fileName)
      .build();

    assertEquals(
      url,
      `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.PUBLIC_RESOURCES_BUCKET}/categories/electronics.svg`,
    );
  });

  it("nullable 썸네일 경로 처리", () => {
    const thumbnailPath: string | null = null;
    const url = PublicStorageUrl.bucket("PUBLIC_RESOURCES_BUCKET")
      .path(thumbnailPath)
      .buildOrNull();

    assertEquals(url, null);
  });

  it("이미지 생성 스타일 썸네일 URL", () => {
    const styleThumbnailPath = "image-generation-styles/styles/studio.png";
    const url = PublicStorageUrl.bucket("PUBLIC_RESOURCES_BUCKET")
      .path(styleThumbnailPath)
      .build();

    assertEquals(
      url,
      `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.PUBLIC_RESOURCES_BUCKET}/image-generation-styles/styles/studio.png`,
    );
  });

  it("샘플 이미지 배열 URL 변환", () => {
    const samplePaths = [
      "samples/001.png",
      "samples/002.png",
      "samples/003.png",
    ];

    const urls = samplePaths.map((path) =>
      PublicStorageUrl.bucket("PUBLIC_RESOURCES_BUCKET").path(path).build()
    );

    assertEquals(urls.length, 3);
    assertEquals(
      urls[0],
      `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.PUBLIC_RESOURCES_BUCKET}/samples/001.png`,
    );
    assertEquals(
      urls[1],
      `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.PUBLIC_RESOURCES_BUCKET}/samples/002.png`,
    );
    assertEquals(
      urls[2],
      `https://test.supabase.co/storage/v1/object/public/${TEST_STORAGE_CONFIG.PUBLIC_RESOURCES_BUCKET}/samples/003.png`,
    );
  });
});
