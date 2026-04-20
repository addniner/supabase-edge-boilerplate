import { DomainError, type DomainErrorItem } from "./domain-error.ts";

/**
 * 외부 provider 가 사용자 API 키를
 * 401/403 으로 거부한 경우 — 키 존재하지만 무효/만료/권한 부족.
 *
 * response envelope 에 `provider` 와 `providerStatus` 를 실어
 * 클라이언트가 "어떤 키를 확인해야 하는지" 를 명시적으로 안내 가능하게 함.
 */
export class ProviderAuthError extends DomainError {
  public readonly provider: string;
  public readonly providerStatus: number;

  constructor(
    provider: string,
    providerStatus: number,
    message?: string,
    errors?: DomainErrorItem[] | null,
  ) {
    super(
      "PROVIDER_AUTH_ERROR",
      message ?? `${provider} API key rejected (status ${providerStatus})`,
      errors,
    );
    this.provider = provider;
    this.providerStatus = providerStatus;
  }
}
