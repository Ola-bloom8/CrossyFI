// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./PostcardNFT.sol";
import "./interfaces/ISpokePool.sol";

/// @title PostcardRouter
/// @notice Bridges USDC via Across depositV3, then mints a postcard NFT on the source chain
contract PostcardRouter {
    using SafeERC20 for IERC20;

    ISpokePool public immutable spokePool;
    PostcardNFT public immutable postcardNFT;
    string public chainName;

    event PaymentSent(
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 destinationChainId,
        uint256 tokenId
    );

    constructor(address _spokePool, address _postcardNFT, string memory _chainName) {
        spokePool = ISpokePool(_spokePool);
        postcardNFT = PostcardNFT(_postcardNFT);
        chainName = _chainName;
    }

    /// @notice Pull USDC, bridge via Across, mint postcard to recipient
    function sendPayment(
        address recipient,
        address inputToken,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 destinationChainId,
        string memory tokenSymbol,
        string memory dstChainName,
        string memory message,
        uint32 quoteTimestamp,
        uint32 fillDeadline
    ) external returns (uint256 tokenId) {
        IERC20(inputToken).safeTransferFrom(msg.sender, address(this), inputAmount);
        IERC20(inputToken).forceApprove(address(spokePool), inputAmount);

        spokePool.depositV3(
            msg.sender,
            recipient,
            inputToken,
            address(0), // equivalent output token on destination
            inputAmount,
            outputAmount,
            destinationChainId,
            address(0),
            quoteTimestamp,
            fillDeadline,
            0,
            ""
        );

        tokenId = postcardNFT.mintPostcard(
            recipient, msg.sender, inputAmount, tokenSymbol, chainName, dstChainName, message
        );

        emit PaymentSent(msg.sender, recipient, inputAmount, destinationChainId, tokenId);
    }
}
